'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function KYCPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const panNumber = formData.get('pan_number') as string
    const aadhaarNumber = formData.get('aadhaar_number') as string
    const incomeProof = formData.get('income_proof') as File
    const idProof = formData.get('id_proof') as File

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Upload Documents to Storage
      let incomeProofUrl = ''
      if (incomeProof.size > 0) {
        const { data, error } = await supabase.storage
          .from('kyc_documents')
          .upload(`${user.id}/income_proof_${Date.now()}`, incomeProof)
        if (error) throw error
        incomeProofUrl = data.path
      }

      let idProofUrl = ''
      if (idProof.size > 0) {
        const { data, error } = await supabase.storage
          .from('kyc_documents')
          .upload(`${user.id}/id_proof_${Date.now()}`, idProof)
        if (error) throw error
        idProofUrl = data.path
      }

      // Update User Record
      const { error: updateError } = await supabase
        .from('users')
        .update({
          pan_number: panNumber,
          aadhaar_number: aadhaarNumber,
          kyc_income_proof_url: incomeProofUrl,
          kyc_id_proof_url: idProofUrl,
          kyc_status: 'submitted'
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      toast.success('KYC Submitted Successfully!')
      router.push('/dashboard')

    } catch (error: any) {
      toast.error(error.message || 'Error submitting KYC')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-xl bg-zinc-900 border-zinc-800 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Complete KYC</CardTitle>
          <CardDescription className="text-zinc-400">
            Mandatory verification required before placing any bets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pan_number" className="text-zinc-300">PAN Number</Label>
                <Input id="pan_number" name="pan_number" required className="bg-zinc-800 border-zinc-700 uppercase" placeholder="ABCDE1234F" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aadhaar_number" className="text-zinc-300">Aadhaar Number</Label>
                <Input id="aadhaar_number" name="aadhaar_number" required className="bg-zinc-800 border-zinc-700" placeholder="1234 5678 9012" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_proof" className="text-zinc-300">ID Proof (Aadhaar / Passport)</Label>
              <Input id="id_proof" name="id_proof" type="file" required className="bg-zinc-800 border-zinc-700 file:text-emerald-500" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="income_proof" className="text-zinc-300">Income Proof (ITR / Bank Statement)</Label>
              <Input id="income_proof" name="income_proof" type="file" required className="bg-zinc-800 border-zinc-700 file:text-emerald-500" />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20">
              {loading ? 'Submitting...' : 'Submit Documents'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
