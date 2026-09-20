import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  checkSession: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const MOCK_ADMIN_USER: User = {
  id: '00000000-0000-0000-0000-000000000000',
  app_metadata: {},
  user_metadata: { full_name: 'Elite Bath Administrator' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'admin@elitebath.com',
  role: 'authenticated'
};

const MOCK_ADMIN_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'admin@elitebath.com',
  full_name: 'Elite Bath Administrator',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  role: 'admin',
  created_at: new Date().toISOString()
};

const MOCK_USER: User = {
  id: '11111111-1111-1111-1111-111111111111',
  app_metadata: {},
  user_metadata: { full_name: 'Elite Bath Customer' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'customer@elitebath.com',
  role: 'authenticated'
};

const MOCK_USER_PROFILE: Profile = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'customer@elitebath.com',
  full_name: 'Elite Bath Customer',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
  role: 'user',
  created_at: new Date().toISOString()
};

const withTimeout = <T>(promise: PromiseLike<T>, ms = 4000): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
};

export const useAuthStore = create<AuthState>((set, get) => {
  // Listen for auth state changes
  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (localStorage.getItem('animemaze_mock_session')) {
      // Retain mock session
      return;
    }
    if (session?.user) {
      const user = session.user;
      try {
        const { data: profile, error } = await withTimeout(
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single(),
          4000
        );
        
        if (error || !profile) {
          const localSaved = localStorage.getItem(`animemaze_profile_${user.id}`);
          const fallbackProfile = localSaved ? JSON.parse(localSaved) : {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar_url: user.user_metadata?.avatar_url || '',
            role: 'user',
            created_at: new Date().toISOString()
          };
          
          set({
            user,
            profile: fallbackProfile,
            loading: false,
            initialized: true
          });
          
          // Cache the session
          localStorage.setItem('animemaze_cached_session', JSON.stringify(user));
          localStorage.setItem('animemaze_cached_profile', JSON.stringify(fallbackProfile));
        } else {
          set({ user, profile: profile as Profile, loading: false, initialized: true });
          
          // Cache the session
          localStorage.setItem('animemaze_cached_session', JSON.stringify(user));
          localStorage.setItem('animemaze_cached_profile', JSON.stringify(profile));
        }
      } catch (_err) {
        const localSaved = localStorage.getItem(`animemaze_profile_${user.id}`);
        const fallbackProfile = localSaved ? JSON.parse(localSaved) : {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || '',
          role: 'user',
          created_at: new Date().toISOString()
        };
        
        set({
          user,
          profile: fallbackProfile,
          loading: false,
          initialized: true
        });
        
        // Cache the session
        localStorage.setItem('animemaze_cached_session', JSON.stringify(user));
        localStorage.setItem('animemaze_cached_profile', JSON.stringify(fallbackProfile));
      }
    } else {
      // Clear cache on sign out
      localStorage.removeItem('animemaze_cached_session');
      localStorage.removeItem('animemaze_cached_profile');
      set({ user: null, profile: null, loading: false, initialized: true });
    }
  });

  return {
    user: null,
    profile: null,
    loading: true,
    initialized: false,

    signIn: async (email, password) => {
      set({ loading: true });
      
      try {
        // Try Supabase Auth first
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Successful login will be handled by the onAuthStateChange listener
        return;
      } catch (supabaseErr: any) {
        console.warn('Supabase authentication failed, checking mock/local accounts:', supabaseErr.message);
        
        // 1. Mock Admin account
        if ((email === 'admin@elitebath.com' || email === 'admin@animemaze.com') && password === 'admin123') {
          localStorage.setItem('animemaze_mock_session', 'true');
          localStorage.setItem('animemaze_mock_user_id', 'mock-admin-id');
          localStorage.setItem('animemaze_cached_session', JSON.stringify(MOCK_ADMIN_USER));
          localStorage.setItem('animemaze_cached_profile', JSON.stringify(MOCK_ADMIN_PROFILE));
          set({
            user: MOCK_ADMIN_USER,
            profile: MOCK_ADMIN_PROFILE,
            loading: false,
            initialized: true
          });
          return;
        }
        
        // 2. Mock default User account
        if ((email === 'customer@elitebath.com' || email === 'user@animemaze.com') && password === 'user123') {
          localStorage.setItem('animemaze_mock_session', 'true');
          localStorage.setItem('animemaze_mock_user_id', 'mock-user-id');
          localStorage.setItem('animemaze_cached_session', JSON.stringify(MOCK_USER));
          localStorage.setItem('animemaze_cached_profile', JSON.stringify(MOCK_USER_PROFILE));
          set({
            user: MOCK_USER,
            profile: MOCK_USER_PROFILE,
            loading: false,
            initialized: true
          });
          return;
        }

        // 3. Locally registered accounts fallback
        const localUsers = JSON.parse(localStorage.getItem('animemaze_local_users') || '[]');
        const matchedLocal = localUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if (matchedLocal) {
          localStorage.setItem('animemaze_mock_session', 'true');
          localStorage.setItem('animemaze_mock_user_id', matchedLocal.id);
          const userObj: User = {
            id: matchedLocal.id,
            app_metadata: {},
            user_metadata: { full_name: matchedLocal.full_name, avatar_url: matchedLocal.avatar_url },
            aud: 'authenticated',
            created_at: matchedLocal.created_at,
            email: matchedLocal.email,
            role: 'authenticated'
          };
          const profileObj: Profile = {
            id: matchedLocal.id,
            email: matchedLocal.email,
            full_name: matchedLocal.full_name,
            avatar_url: matchedLocal.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
            role: matchedLocal.role || 'user',
            created_at: matchedLocal.created_at
          };
          localStorage.setItem('animemaze_cached_session', JSON.stringify(userObj));
          localStorage.setItem('animemaze_cached_profile', JSON.stringify(profileObj));
          set({
            user: userObj,
            profile: profileObj,
            loading: false,
            initialized: true
          });
          return;
        }

        set({ loading: false });
        throw supabaseErr;
      }
    },

    checkSession: async () => {
      // Check for cached session first for instant restoration
      const cachedSession = localStorage.getItem('animemaze_cached_session');
      const cachedProfile = localStorage.getItem('animemaze_cached_profile');
      
      if (cachedSession && cachedProfile) {
        try {
          const sessionData = JSON.parse(cachedSession);
          const profileData = JSON.parse(cachedProfile);
          
          // Restore from cache instantly
          set({
            user: sessionData,
            profile: profileData,
            loading: false,
            initialized: true
          });
          
          // Validate session in background without blocking UI
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
              // Session invalid, clear cache and state
              localStorage.removeItem('animemaze_cached_session');
              localStorage.removeItem('animemaze_cached_profile');
              set({ user: null, profile: null, loading: false, initialized: true });
            } else {
              // Session valid, refresh profile in background
              supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()
                .then(({ data: profile }) => {
                  if (profile) {
                    localStorage.setItem('animemaze_cached_profile', JSON.stringify(profile));
                    set({ profile: profile as Profile });
                  }
                });
            }
          });
          return;
        } catch (_e) {
          // Cache corrupted, clear and continue
          localStorage.removeItem('animemaze_cached_session');
          localStorage.removeItem('animemaze_cached_profile');
        }
      }

      // No cached session, check mock sessions
      if (localStorage.getItem('animemaze_mock_session') === 'true') {
        const mockUserId = localStorage.getItem('animemaze_mock_user_id') || '';
        
        if (mockUserId === 'mock-admin-id') {
          const savedProfile = localStorage.getItem('animemaze_mock_profile_admin');
          set({
            user: MOCK_ADMIN_USER,
            profile: savedProfile ? JSON.parse(savedProfile) : MOCK_ADMIN_PROFILE,
            loading: false,
            initialized: true
          });
          return;
        }
        
        if (mockUserId === 'mock-user-id' || !mockUserId) {
          const savedProfile = localStorage.getItem('animemaze_mock_profile_user');
          set({
            user: MOCK_USER,
            profile: savedProfile ? JSON.parse(savedProfile) : MOCK_USER_PROFILE,
            loading: false,
            initialized: true
          });
          return;
        }

        // Check local storage users list
        const localUsers = JSON.parse(localStorage.getItem('animemaze_local_users') || '[]');
        const matchedLocal = localUsers.find((u: any) => u.id === mockUserId);
        if (matchedLocal) {
          const userObj: User = {
            id: matchedLocal.id,
            app_metadata: {},
            user_metadata: { full_name: matchedLocal.full_name, avatar_url: matchedLocal.avatar_url },
            aud: 'authenticated',
            created_at: matchedLocal.created_at,
            email: matchedLocal.email,
            role: 'authenticated'
          };
          const profileObj: Profile = {
            id: matchedLocal.id,
            email: matchedLocal.email,
            full_name: matchedLocal.full_name,
            avatar_url: matchedLocal.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
            role: matchedLocal.role || 'user',
            created_at: matchedLocal.created_at
          };
          set({
            user: userObj,
            profile: profileObj,
            loading: false,
            initialized: true
          });
          return;
        }
        
        // If mock session exists but no matched mock user, clear keys to avoid infinite loading loops
        localStorage.removeItem('animemaze_mock_session');
        localStorage.removeItem('animemaze_mock_user_id');
      }

      // No cached session, set loading state
      set({ loading: true });
      
      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 4000);
        if (session?.user) {
          const user = session.user;
          const { data: profile, error } = await withTimeout(
            supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single(),
            4000
          );

          if (error) {
            const localSaved = localStorage.getItem(`animemaze_profile_${user.id}`);
            const fallbackProfile = localSaved ? JSON.parse(localSaved) : {
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              avatar_url: user.user_metadata?.avatar_url || '',
              role: 'user',
              created_at: new Date().toISOString()
            };
            
            set({
              user,
              profile: fallbackProfile,
              loading: false,
              initialized: true
            });
            
            // Cache the session for instant restoration
            localStorage.setItem('animemaze_cached_session', JSON.stringify(user));
            localStorage.setItem('animemaze_cached_profile', JSON.stringify(fallbackProfile));
          } else {
            set({ user, profile: profile as Profile, loading: false, initialized: true });
            
            // Cache the session for instant restoration
            localStorage.setItem('animemaze_cached_session', JSON.stringify(user));
            localStorage.setItem('animemaze_cached_profile', JSON.stringify(profile));
          }
        } else {
          set({ user: null, profile: null, loading: false, initialized: true });
        }
      } catch (err) {
        console.error('Error fetching session:', err);
        set({ user: null, profile: null, loading: false, initialized: true });
      }
    },

    signOut: async () => {
      set({ loading: true });
      localStorage.removeItem('animemaze_mock_session');
      localStorage.removeItem('animemaze_mock_user_id');
      localStorage.removeItem('animemaze_cached_session');
      localStorage.removeItem('animemaze_cached_profile');
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
      set({ user: null, profile: null, loading: false, initialized: true });
    },

    updateProfile: async (updates) => {
      if (localStorage.getItem('animemaze_mock_session') === 'true') {
        const currentProfile = get().profile;
        if (currentProfile) {
          const updatedProfile = { ...currentProfile, ...updates };
          set({ profile: updatedProfile });
          
          const mockUserId = localStorage.getItem('animemaze_mock_user_id') || '';
          if (mockUserId === 'mock-admin-id') {
            localStorage.setItem('animemaze_mock_profile_admin', JSON.stringify(updatedProfile));
          } else if (mockUserId === 'mock-user-id') {
            localStorage.setItem('animemaze_mock_profile_user', JSON.stringify(updatedProfile));
          } else {
            // Update in local users list
            const localUsers = JSON.parse(localStorage.getItem('animemaze_local_users') || '[]');
            const updatedUsers = localUsers.map((u: any) => {
              if (u.id === mockUserId) {
                return { ...u, full_name: updatedProfile.full_name, avatar_url: updatedProfile.avatar_url };
              }
              return u;
            });
            localStorage.setItem('animemaze_local_users', JSON.stringify(updatedUsers));
          }
        }
        return;
      }
      const { user } = get();
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();

        if (!error && data) {
          set({ profile: data as Profile });
        } else {
          throw error;
        }
      } catch (err) {
        console.warn('Supabase profile update failed, updating locally in state:', err);
        const currentProfile = get().profile;
        if (currentProfile) {
          const updatedProfile = { ...currentProfile, ...updates };
          set({ profile: updatedProfile });
          localStorage.setItem(`animemaze_profile_${user.id}`, JSON.stringify(updatedProfile));
        }
      }
    }
  };
});
