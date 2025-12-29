import { gql } from 'apollo-server-express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_KEY!
);

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type User {
    id: ID!
    email: String!
    name: String
    role: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    calls(limit: Int, offset: Int): [Call!]!
    contacts(limit: Int, offset: Int): [Contact!]!
    callStats(startDate: DateTime, endDate: DateTime): CallStats!
  }

  type Call {
    id: ID!
    userId: ID!
    contactId: ID
    status: CallStatus!
    duration: Int
    startedAt: DateTime!
    endedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User!
    contact: Contact
    transcriptions: [Transcription!]!
  }

  type Contact {
    id: ID!
    userId: ID!
    name: String!
    phone: String
    email: String
    company: String
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User!
    calls(limit: Int, offset: Int): [Call!]!
  }

  type Transcription {
    id: ID!
    callId: ID!
    content: String!
    confidence: Float!
    language: String!
    createdAt: DateTime!
    call: Call!
  }

  type CallStats {
    totalCalls: Int!
    completedCalls: Int!
    failedCalls: Int!
    totalDuration: Int!
    avgDuration: Float!
    successRate: Float!
  }

  enum CallStatus {
    ACTIVE
    COMPLETED
    FAILED
    CANCELLED
  }

  type Query {
    user(id: ID!): User
    users(limit: Int, offset: Int): [User!]!
    call(id: ID!): Call
    calls(userId: ID!, limit: Int, offset: Int): [Call!]!
    contact(id: ID!): Contact
    contacts(userId: ID!, limit: Int, offset: Int): [Contact!]!
    searchContacts(userId: ID!, query: String!, limit: Int): [Contact!]!
    transcription(id: ID!): Transcription
    transcriptions(callId: ID!): [Transcription!]!
    callStats(userId: ID!, startDate: DateTime, endDate: DateTime): CallStats!
  }

  type Mutation {
    createUser(email: String!, name: String, role: String): User!
    updateUser(id: ID!, email: String, name: String, role: String): User!
    deleteUser(id: ID!): Boolean!
    
    createCall(userId: ID!, contactId: ID, metadata: JSON): Call!
    updateCall(id: ID!, status: CallStatus, metadata: JSON): Call!
    endCall(id: ID!, status: CallStatus): Call!
    deleteCall(id: ID!): Boolean!
    
    createContact(userId: ID!, name: String!, phone: String, email: String, company: String, notes: String): Contact!
    updateContact(id: ID!, name: String, phone: String, email: String, company: String, notes: String): Contact!
    deleteContact(id: ID!): Boolean!
    
    createTranscription(callId: ID!, content: String!, confidence: Float!, language: String!): Transcription!
  }
`;

export const resolvers = {
  Query: {
    user: async (_: any, { id }: { id: string }) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw new Error(`User not found: ${error.message}`);
      return data;
    },

    users: async (_: any, { limit = 50, offset = 0 }: { limit?: number; offset?: number }) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .range(offset, offset + limit - 1);
      
      if (error) throw new Error(`Failed to fetch users: ${error.message}`);
      return data || [];
    },

    call: async (_: any, { id }: { id: string }) => {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw new Error(`Call not found: ${error.message}`);
      return data;
    },

    calls: async (_: any, { userId, limit = 50, offset = 0 }: { userId: string; limit?: number; offset?: number }) => {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw new Error(`Failed to fetch calls: ${error.message}`);
      return data || [];
    },

    contact: async (_: any, { id }: { id: string }) => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw new Error(`Contact not found: ${error.message}`);
      return data;
    },

    contacts: async (_: any, { userId, limit = 50, offset = 0 }: { userId: string; limit?: number; offset?: number }) => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .order('name')
        .range(offset, offset + limit - 1);
      
      if (error) throw new Error(`Failed to fetch contacts: ${error.message}`);
      return data || [];
    },

    searchContacts: async (_: any, { userId, query, limit = 50 }: { userId: string; query: string; limit?: number }) => {
      const { data, error } = await supabase
        .rpc('search_contacts', { p_user_id: userId, p_query: query, p_limit: limit });
      
      if (error) throw new Error(`Search failed: ${error.message}`);
      return data || [];
    },

    transcription: async (_: any, { id }: { id: string }) => {
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw new Error(`Transcription not found: ${error.message}`);
      return data;
    },

    transcriptions: async (_: any, { callId }: { callId: string }) => {
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('call_id', callId);
      
      if (error) throw new Error(`Failed to fetch transcriptions: ${error.message}`);
      return data || [];
    },

    callStats: async (_: any, { userId, startDate, endDate }: { userId: string; startDate?: string; endDate?: string }) => {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();
      
      const { data, error } = await supabase
        .rpc('get_call_stats', { 
          p_user_id: userId, 
          p_start_date: start, 
          p_end_date: end 
        });
      
      if (error) throw new Error(`Failed to calculate stats: ${error.message}`);
      return data?.[0] || {
        totalCalls: 0,
        completedCalls: 0,
        failedCalls: 0,
        totalDuration: 0,
        avgDuration: 0,
        successRate: 0,
      };
    },
  },

  Mutation: {
    createUser: async (_: any, { email, name, role = 'user' }: { email: string; name?: string; role?: string }) => {
      const { data, error } = await supabase
        .from('users')
        .insert({ email, name, role })
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create user: ${error.message}`);
      return data;
    },

    updateUser: async (_: any, { id, email, name, role }: { id: string; email?: string; name?: string; role?: string }) => {
      const updates: any = {};
      if (email) updates.email = email;
      if (name) updates.name = name;
      if (role) updates.role = role;
      
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update user: ${error.message}`);
      return data;
    },

    deleteUser: async (_: any, { id }: { id: string }) => {
      const { error } = await supabase.rpc('soft_delete_user', { p_user_id: id });
      if (error) throw new Error(`Failed to delete user: ${error.message}`);
      return true;
    },

    createCall: async (_: any, { userId, contactId, metadata }: { userId: string; contactId?: string; metadata?: any }) => {
      const { data, error } = await supabase
        .from('calls')
        .insert({
          user_id: userId,
          contact_id: contactId,
          status: 'active',
          started_at: new Date().toISOString(),
          metadata,
        })
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create call: ${error.message}`);
      return data;
    },

    updateCall: async (_: any, { id, status, metadata }: { id: string; status?: string; metadata?: any }) => {
      const updates: any = {};
      if (status) updates.status = status;
      if (metadata) updates.metadata = metadata;
      
      const { data, error } = await supabase
        .from('calls')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update call: ${error.message}`);
      return data;
    },

    endCall: async (_: any, { id, status = 'completed' }: { id: string; status?: string }) => {
      const { data, error } = await supabase
        .rpc('end_call', { p_call_id: id, p_status: status });
      
      if (error) throw new Error(`Failed to end call: ${error.message}`);
      return data?.[0];
    },

    deleteCall: async (_: any, { id }: { id: string }) => {
      const { error } = await supabase
        .from('calls')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw new Error(`Failed to delete call: ${error.message}`);
      return true;
    },

    createContact: async (_: any, args: any) => {
      const { userId, name, phone, email, company, notes } = args;
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          user_id: userId,
          name,
          phone,
          email,
          company,
          notes,
        })
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create contact: ${error.message}`);
      return data;
    },

    updateContact: async (_: any, args: any) => {
      const { id, name, phone, email, company, notes } = args;
      const updates: any = {};
      if (name) updates.name = name;
      if (phone) updates.phone = phone;
      if (email) updates.email = email;
      if (company) updates.company = company;
      if (notes !== undefined) updates.notes = notes;
      
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update contact: ${error.message}`);
      return data;
    },

    deleteContact: async (_: any, { id }: { id: string }) => {
      const { error } = await supabase
        .from('contacts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw new Error(`Failed to delete contact: ${error.message}`);
      return true;
    },

    createTranscription: async (_: any, args: any) => {
      const { callId, content, confidence, language } = args;
      const { data, error } = await supabase
        .from('transcriptions')
        .insert({
          call_id: callId,
          content,
          confidence,
          language,
        })
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create transcription: ${error.message}`);
      return data;
    },
  },

  User: {
    calls: async (parent: any, { limit = 50, offset = 0 }: any) => {
      const { data } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', parent.id)
        .range(offset, offset + limit - 1);
      return data || [];
    },
    contacts: async (parent: any, { limit = 50, offset = 0 }: any) => {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', parent.id)
        .range(offset, offset + limit - 1);
      return data || [];
    },
    callStats: async (parent: any, { startDate, endDate }: any) => {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();
      const { data } = await supabase.rpc('get_call_stats', { 
        p_user_id: parent.id, 
        p_start_date: start, 
        p_end_date: end 
      });
      return data?.[0];
    },
  },

  Call: {
    user: async (parent: any) => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', parent.user_id)
        .single();
      return data;
    },
    contact: async (parent: any) => {
      if (!parent.contact_id) return null;
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', parent.contact_id)
        .single();
      return data;
    },
    transcriptions: async (parent: any) => {
      const { data } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('call_id', parent.id);
      return data || [];
    },
  },

  Contact: {
    user: async (parent: any) => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', parent.user_id)
        .single();
      return data;
    },
    calls: async (parent: any, { limit = 50, offset = 0 }: any) => {
      const { data } = await supabase
        .from('calls')
        .select('*')
        .eq('contact_id', parent.id)
        .range(offset, offset + limit - 1);
      return data || [];
    },
  },

  Transcription: {
    call: async (parent: any) => {
      const { data } = await supabase
        .from('calls')
        .select('*')
        .eq('id', parent.call_id)
        .single();
      return data;
    },
  },
};
