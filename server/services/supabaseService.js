const supabase = require('../config/supabase');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const LOG_FILE = path.join(__dirname, '../../scratch/server_debug.log');

const logToDisk = (message) => {
  // Disabled to prevent nodemon restart loop
  /*
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (err) {
    console.error('Failed to write to debug log:', err);
  }
  */
};

const COLLECTIONS = {
  USERS: 'users',
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  PARENTS: 'parents',
  COURSES: 'class_subjects',
  GRADES: 'grades',
  ATTENDANCE: 'attendance',
  FEES: 'fees',
  PAYMENTS: 'payments',
  EXPENSES: 'expenses',
  INCOME: 'income',
  ASSIGNMENTS: 'assignments',
  EVENTS: 'events',
  TIMETABLE: 'timetable',
  SETTINGS: 'settings',
  EXAMS: 'exams',
  GRADE_MASTERS: 'grade_masters',
  ACADEMIC_CLASSES: 'academic_classes',
  SECTIONS: 'sections',
  SUBJECTS: 'subjects',
  CLASS_SUBJECTS: 'class_subjects',
  LOGIN_HISTORY: 'login_history',
  ACTIVITY_LOGS: 'activity_logs',
  ACADEMIC_CALENDAR: 'academic_calendar'
};

const generateId = () => crypto.randomUUID();

const supabaseService = {
  async getAll(collection, options = {}) {
    const { limit = null, orderBy = 'created_at', orderDirection = 'desc' } = options;
    
    try {
      let query = supabase.from(collection).select('*');
      if (limit) query = query.limit(limit);
      if (orderBy) query = query.order(orderBy, { ascending: orderDirection === 'asc' });
      
      const { data, error } = await query;
      if (error) {
        // If ordering by created_at fails, try without ordering
        if (orderBy === 'created_at' && (error.message?.includes('column') || error.code === '42703')) {
          const fallbackQuery = supabase.from(collection).select('*');
          if (limit) fallbackQuery.limit(limit);
          const { data: fallbackData, error: fallbackError } = await fallbackQuery;
          if (fallbackError) throw fallbackError;
          return fallbackData || [];
        }
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error(`[SUPABASE SERVICE ERROR] getAll failed for ${collection}:`, err.message);
      throw err;
    }
  },

  async getById(collection, id) {
    const { data, error } = await supabase.from(collection).select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  async query(collection, field, operator, value) {
    let query = supabase.from(collection).select('*');
    
    switch (operator) {
      case '==':
        query = query.eq(field, value);
        break;
      case '>':
        query = query.gt(field, value);
        break;
      case '<':
        query = query.lt(field, value);
        break;
      case '>=':
        query = query.gte(field, value);
        break;
      case '<=':
        query = query.lte(field, value);
        break;
      case 'in':
        query = query.in(field, value);
        break;
      case 'like':
        query = query.ilike(field, `%${value}%`);
        break;
      default:
        query = query.eq(field, value);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(collection, data) {
    const logMsg = `Creating record in ${collection}: ${JSON.stringify(data, null, 2)}`;
    console.log(`[DB] ${logMsg}`);
    
    let currentData = { ...data };
    
    while (true) {
      const { data: result, error } = await supabase
        .from(collection)
        .insert(currentData)
        .select()
        .maybeSingle();

      if (!error) return result;

      // Handle missing column error (PGRST204)
      if (error.code === 'PGRST204' || (error.message?.includes('column') && error.message?.includes('not find'))) {
        const problematicField = error.message.match(/'([^']+)' column/)?.[1];
        if (problematicField && currentData.hasOwnProperty(problematicField)) {
          console.warn(`[DB] Stripping missing column '${problematicField}' from ${collection} insert and retrying...`);
          delete currentData[problematicField];
          continue; // Retry with stripped data
        }
      }

      const errMsg = `Error in create (${collection}): ${JSON.stringify(error, null, 2)}`;
      console.error(`[DB] ${errMsg}`);
      throw error;
    }
  },

  async update(collection, id, data) {
    const logMsg = `Updating record in ${collection} ID ${id}: ${JSON.stringify(data, null, 2)}`;
    console.log(`[DB] ${logMsg}`);

    let currentData = { ...data, updated_at: new Date().toISOString() };
    
    while (true) {
      const { data: result, error } = await supabase
        .from(collection)
        .update(currentData)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (!error) return result;

      // Handle missing column error (PGRST204 or specific message)
      if (error.code === 'PGRST204' || (error.message?.includes('column') && error.message?.includes('not find'))) {
        const problematicField = error.message.match(/'([^']+)' column/)?.[1];
        if (problematicField && currentData.hasOwnProperty(problematicField)) {
          console.warn(`[DB] Stripping missing column '${problematicField}' from ${collection} update and retrying...`);
          delete currentData[problematicField];
          continue; // Retry
        }
      }

      const errMsg = `Error in update (${collection}): ${JSON.stringify(error, null, 2)}`;
      console.error(`[DB] ${errMsg}`);
      throw error;
    }
  },

  async delete(collection, id) {
    const { error } = await supabase.from(collection).delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  async count(collection, field = null, operator = null, value = null) {
    let query = supabase.from(collection).select('*', { count: 'exact', head: true });
    
    if (field && operator && value) {
      query = query.eq(field, value);
    }
    
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  async getByField(collection, field, value) {
    const { data, error } = await supabase
      .from(collection)
      .select('*')
      .eq(field, value)
      .limit(1)
      .single();
    if (error) return null;
    return data;
  },

  async getManyByField(collection, field, value) {
    const { data, error } = await supabase
      .from(collection)
      .select('*')
      .eq(field, value);
    if (error) throw error;
    return data || [];
  },

  async addToArray(collection, id, field, value) {
    const doc = await this.getById(collection, id);
    if (!doc) throw new Error('Document not found');
    
    const currentArray = doc[field] || [];
    const newArray = [...currentArray, value];
    
    return this.update(collection, id, { [field]: newArray });
  },

  async removeFromArray(collection, id, field, value) {
    const doc = await this.getById(collection, id);
    if (!doc) throw new Error('Document not found');
    
    const currentArray = doc[field] || [];
    const newArray = currentArray.filter(item => item !== value);
    
    return this.update(collection, id, { [field]: newArray });
  },

  async getPaginated(collection, { page = 1, limit = 20, orderBy = 'created_at', orderDirection = 'desc' }) {
    const offset = (page - 1) * limit;
    let query = supabase.from(collection).select('*', { count: 'exact' });
    
    const { count, error: countError } = await query;
    if (countError) throw countError;
    const total = count || 0;
    
    query = supabase.from(collection).select('*').order(orderBy, { ascending: orderDirection === 'asc' }).range(offset, offset + limit - 1);
    const { data, error } = await query;
    if (error) throw error;
    
    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  async search(collection, searchFields, searchTerm) {
    const { data, error } = await supabase.from(collection).select('*');
    if (error) throw error;
    
    const results = (data || []).filter(doc => {
      return searchFields.some(field => {
        const value = doc[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    });
    
    return results;
  },

  async bulkUpsert(collection, data, options = {}) {
    const { onConflict = 'id' } = options;
    const logMsg = `Bulk upserting ${data.length} records in ${collection}`;
    console.log(`[DB] ${logMsg}`);
    logToDisk(logMsg);
    
    const { data: result, error } = await supabase
      .from(collection)
      .upsert(data, { onConflict })
      .select();
      
    if (error) {
      const errMsg = `Error in bulkUpsert (${collection}): ${JSON.stringify(error, null, 2)}`;
      console.error(`[DB] ${errMsg}`);
      logToDisk(errMsg);
      throw error;
    }
    return result;
  }
};

module.exports = {
  supabaseService,
  COLLECTIONS,
  generateId,
  firestoreService: supabaseService // Legacy support during transition
};