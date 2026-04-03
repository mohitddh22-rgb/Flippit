'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function updateKycStatus(userId: string, status: 'verified' | 'rejected') {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify requester is admin
  const { data: adminUser } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminUser?.is_admin) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('users')
    .update({ kyc_status: status })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/kyc')
  revalidatePath('/dashboard')
}

export async function updateWithdrawalStatus(withdrawalId: string, status: 'completed' | 'rejected', reason?: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: adminUser } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminUser?.is_admin) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('withdrawals')
    .update({ 
      status, 
      rejection_reason: reason,
      processed_at: status === 'completed' ? new Date().toISOString() : null
    })
    .eq('id', withdrawalId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/withdrawals')
  revalidatePath('/wallet')
}
