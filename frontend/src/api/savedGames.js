import { supabase } from '../lib/supabase'

/**
 * Save an analyzed game to Supabase for the current user.
 * @param {{ analysis, pgnText, players }} gameData
 */
export async function saveGame({ analysis, pgnText, players }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in to save games.')

  const { error } = await supabase
    .from('analyzed_games')
    .insert({
      user_id:  user.id,
      white:    players?.white?.name ?? analysis?.moves?.[0]?.played_move ?? 'White',
      black:    players?.black?.name ?? 'Black',
      analysis: analysis,
      pgn_text: pgnText,
    })

  if (error) throw new Error(error.message)
}

/**
 * Fetch all saved games for the current user, newest first.
 */
export async function fetchSavedGames() {
  const { data, error } = await supabase
    .from('analyzed_games')
    .select('id, white, black, created_at, analysis->total_moves, analysis->white->accuracy, analysis->black->accuracy')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Fetch a single saved game by ID (full analysis + pgn_text).
 */
export async function fetchSavedGame(id) {
  const { data, error } = await supabase
    .from('analyzed_games')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Delete a saved game by ID.
 */
export async function deleteSavedGame(id) {
  const { error } = await supabase
    .from('analyzed_games')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}