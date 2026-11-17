import { supabase } from './supabase';

export async function testConnection() {
  const { data, error } = await supabase
    .from('categories')
    .select('*');

  if (error) {
    console.error('Connection failed:', error.message);
    return;
  }

  console.log('Supabase connected successfully!');
  console.log('Categories:', data);
}