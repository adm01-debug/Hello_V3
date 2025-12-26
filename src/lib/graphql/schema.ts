import { gql } from 'graphql-tag';
import { ApolloServer } from '@apollo/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_KEY!
);

// Type definitions
const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String
    role: String!
    createdAt: String!
    calls: [Call!]!
    contacts: [Contact!]!
  }

  type Call {
    id: ID!
    userId: ID!
    contactId: ID
    status: String!
    duration: Int
    startedAt: String!
    endedAt: String
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
    user: User!
    calls: [Call!]!
  }

  type Transcription {
    id: ID!
    callId: ID!
    text: String!
    confidence: Float!
    createdAt: String!
    call: Call!
  }

  type CallStats {
    totalCalls: Int!
    totalDuration: Int!
    avgDuration: Float!
    completedCalls: Int!
    failedCalls: Int!
    successRate: Float!
  }

  type Query {
    # Users
    user(id: ID!): User
    users(limit: Int, offset: Int): [User!]!
    
    # Calls
    call(id: ID!): Call
    calls(userId: ID!, limit: Int, offset: Int): [Call!]!
    callStats(userId: ID!, startDate: String, endDate: String): CallStats!
    
    # Contacts
    contact(id: ID!): Contact
    contacts(userId: ID!, limit: Int, offset: Int): [Contact!]!
    searchContacts(userId: ID!, query: String!): [Contact!]!
    
    # Transcriptions
    transcription(id: ID!): Transcription
    transcriptions(callId: ID!): [Transcription!]!
  }

  type Mutation {
    # Users
    createUser(email: String!, name: String, role: String): User!
    updateUser(id: ID!, email: String, name: String, role: String): User!
    deleteUser(id: ID!): Boolean!
    
    # Calls
    startCall(userId: ID!, contactId: ID): Call!
    endCall(id: ID!, status: String): Call!
    
    # Contacts
    createContact(userId: ID!, name: String!, phone: String, email: String, company: String): Contact!
    updateContact(id: ID!, name: String, phone: String, email: String, company: String): Contact!
    deleteContact(id: ID!): Boolean!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    user: async (_: any, { id }: any) => {
      const { data } = await supabase.from('users').select('*').eq('id', id).single();
      return data;
    },
    
    users: async (_: any, { limit = 10, offset = 0 }: any) => {
      const { data } = await supabase.from('users').select('*').range(offset, offset + limit - 1);
      return data;
    },
    
    call: async (_: any, { id }: any) => {
      const { data } = await supabase.from('calls').select('*').eq('id', id).single();
      return data;
    },
    
    calls: async (_: any, { userId, limit = 10, offset = 0 }: any) => {
      const { data } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', userId)
        .range(offset, offset + limit - 1)
        .order('started_at', { ascending: false });
      return data;
    },
    
    callStats: async (_: any, { userId, startDate, endDate }: any) => {
      const { data } = await supabase.rpc('get_call_stats', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate,
      });
      return data[0];
    },
    
    contact: async (_: any, { id }: any) => {
      const { data } = await supabase.from('contacts').select('*').eq('id', id).single();
      return data;
    },
    
    contacts: async (_: any, { userId, limit = 10, offset = 0 }: any) => {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .range(offset, offset + limit - 1)
        .order('name');
      return data;
    },
    
    searchContacts: async (_: any, { userId, query }: any) => {
      const { data } = await supabase.rpc('search_contacts', {
        p_user_id: userId,
        p_query: query,
      });
      return data;
    },
    
    transcription: async (_: any, { id }: any) => {
      const { data } = await supabase.from('transcriptions').select('*').eq('id', id).single();
      return data;
    },
    
    transcriptions: async (_: any, { callId }: any) => {
      const { data } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('call_id', callId)
        .order('created_at');
      return data;
    },
  },
  
  Mutation: {
    createUser: async (_: any, args: any) => {
      const { data } = await supabase.from('users').insert(args).select().single();
      return data;
    },
    
    updateUser: async (_: any, { id, ...updates }: any) => {
      const { data } = await supabase.from('users').update(updates).eq('id', id).select().single();
      return data;
    },
    
    deleteUser: async (_: any, { id }: any) => {
      await supabase.from('users').delete().eq('id', id);
      return true;
    },
    
    startCall: async (_: any, { userId, contactId }: any) => {
      const { data } = await supabase
        .from('calls')
        .insert({
          user_id: userId,
          contact_id: contactId,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      return data;
    },
    
    endCall: async (_: any, { id, status }: any) => {
      const { data } = await supabase.rpc('end_call', {
        p_call_id: id,
        p_status: status || 'completed',
      });
      return data[0];
    },
    
    createContact: async (_: any, args: any) => {
      const { data } = await supabase.from('contacts').insert(args).select().single();
      return data;
    },
    
    updateContact: async (_: any, { id, ...updates }: any) => {
      const { data } = await supabase.from('contacts').update(updates).eq('id', id).select().single();
      return data;
    },
    
    deleteContact: async (_: any, { id }: any) => {
      await supabase.from('contacts').delete().eq('id', id);
      return true;
    },
  },
  
  // Field resolvers
  User: {
    calls: async (parent: any) => {
      const { data } = await supabase.from('calls').select('*').eq('user_id', parent.id);
      return data;
    },
    contacts: async (parent: any) => {
      const { data } = await supabase.from('contacts').select('*').eq('user_id', parent.id);
      return data;
    },
  },
  
  Call: {
    user: async (parent: any) => {
      const { data } = await supabase.from('users').select('*').eq('id', parent.user_id).single();
      return data;
    },
    contact: async (parent: any) => {
      if (!parent.contact_id) return null;
      const { data } = await supabase.from('contacts').select('*').eq('id', parent.contact_id).single();
      return data;
    },
    transcriptions: async (parent: any) => {
      const { data } = await supabase.from('transcriptions').select('*').eq('call_id', parent.id);
      return data;
    },
  },
  
  Contact: {
    user: async (parent: any) => {
      const { data } = await supabase.from('users').select('*').eq('id', parent.user_id).single();
      return data;
    },
    calls: async (parent: any) => {
      const { data } = await supabase.from('calls').select('*').eq('contact_id', parent.id);
      return data;
    },
  },
  
  Transcription: {
    call: async (parent: any) => {
      const { data } = await supabase.from('calls').select('*').eq('id', parent.call_id).single();
      return data;
    },
  },
};

// Create Apollo Server
export const createGraphQLServer = () => {
  return new ApolloServer({
    typeDefs,
    resolvers,
  });
};
