import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user:        null,   // Supabase user object
  session:     null,   // Supabase session (contains JWT)
  loading:     true,   // true while we're checking existing session on mount
  authError:   null,

  //  Called once on app mount to restore existing session 
  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({
      session,
      user:    session?.user ?? null,
      loading: false,
    })

    // Keep store in sync when Supabase updates the session
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user:    session?.user ?? null,
        loading: false,
      })
    })
  },

  //  Sign up 
  signUp: async (email, password) => {
    set({ authError: null })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    if (error) { set({ authError: error.message }); return { error } }
    return { data }
  },

  //  Sign in 
  signIn: async (email, password) => {
    set({ authError: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { set({ authError: error.message }); return { error } }
    set({ session: data.session, user: data.user })
    return { data }
  },

  //Sign out
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  // Forgot password 
  resetPassword: async (email) => {
    set({ authError: null })
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { set({ authError: error.message }); return { error } }
    return { success: true }
  },

  // Update password (called from reset link)
  updatePassword: async (newPassword) => {
    set({ authError: null })
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { set({ authError: error.message }); return { error } }
    return { success: true }
  },

  clearError: () => set({ authError: null }),
}))