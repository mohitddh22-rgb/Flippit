'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = createClient()

  // We are supporting email/phone + password. For now, email + password.
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect(`/auth/login?message=${error.message}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const dob = formData.get('dob') as string

  // 1. Sign up the user in auth.users
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return redirect(`/auth/register?message=${error.message}`)
  }

  // 2. We use triggers usually for users table, but the schema requires we put custom data.
  // Wait, if we use supabase auth.users, inserting into 'users' table is usually governed by a trigger.
  // But let's insert it manually if trigger is not present, or if it is, update the record.
  // The provided schema doesn't have a trigger! I'll do a direct insert/upsert.
  if (data.user) {
    const { error: dbError } = await supabase.from('users').upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      phone,
      date_of_birth: dob,
    })

    if (dbError) {
       console.error("DB Error", dbError);
    }
  }

  revalidatePath('/', 'layout')
  redirect('/auth/otp') // Or redirect to verify page
}
