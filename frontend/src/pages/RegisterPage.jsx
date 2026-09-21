import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  User,
  Building2,
  FileText,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Check
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const [role, setRole] = useState('individual')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const [indForm, setIndForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
  })

  const [ngoForm, setNgoForm] = useState({
    orgName: '',
    orgType: 'Disaster Relief & First Response',
    regNumber: '',
    contactPerson: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
  })

  const [proofFile, setProofFile] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Proof document must be smaller than 10MB.')
        return
      }

      setProofFile(file)
      setErrorMessage('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    const current = role === 'individual' ? indForm : ngoForm

    if (current.password !== current.confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-check.')
      return
    }

    if (role === 'ngo' && !proofFile) {
      setErrorMessage('Please select a proof document for NGO verification.')
      return
    }

    setLoading(true)

    try {
      const payload =
        role === 'individual'
          ? {
              role: role === 'volunteer' ? 'VOLUNTEER' : 'INDIVIDUAL',
              name: indForm.fullName,
              email: indForm.email,
              phone: indForm.phone,
              password: indForm.password,
              location: indForm.location,
            }
          : {
              role: 'NGO',
              organizationName: ngoForm.orgName,
              organizationType: ngoForm.orgType,
              registrationNumber: ngoForm.regNumber,
              name: ngoForm.contactPerson,
              email: ngoForm.email,
              phone: ngoForm.phone,
              password: ngoForm.password,
              location: ngoForm.location,
              proofDocument: proofFile ? proofFile.name : null,
            }

      const data = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) })

      setUser(data.user)
      navigate('/home')
    } catch (error) {
      setErrorMessage(error.message || 'Unable to connect to the ReliefGrid server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Operations Center</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-10 backdrop-blur-xl shadow-2xl space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Join the ReliefGrid Network
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Register as a community responder or an accredited NGO to coordinate critical crisis relief.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-cyan-500/20 text-xs text-slate-300 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-[11px] text-slate-400">
            <p>
              <strong className="text-cyan-300">Secure Registration:</strong> Your account is securely processed by the ReliefGrid backend.
            </p>
            <p>
              Passwords are hashed before being stored and authentication uses a secure HTTP-only session cookie.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 relative">
          <button
            type="button"
            onClick={() => {
              setRole('individual')
              setSubmitted(false)
              setErrorMessage('')
            }}
            className={`relative flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-colors z-10 ${
              role === 'individual' ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            {role === 'individual' && (
              <motion.div
                layoutId="register-role-pill"
                className="absolute inset-0 rounded-xl bg-slate-800 border border-slate-700 shadow-md -z-10"
              />
            )}
            <User className="w-4 h-4" />
            <span>Individual</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('volunteer')
              setSubmitted(false)
              setErrorMessage('')
            }}
            className={`relative flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-colors z-10 ${
              role === 'volunteer' ? 'text-emerald-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            {role === 'volunteer' && (
              <motion.div
                layoutId="register-role-pill"
                className="absolute inset-0 rounded-xl bg-slate-800 border border-slate-700 shadow-md -z-10"
              />
            )}
            <User className="w-4 h-4" />
            <span>Volunteer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('ngo')
              setSubmitted(false)
              setErrorMessage('')
            }}
            className={`relative flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-colors z-10 ${
              role === 'ngo' ? 'text-emerald-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            {role === 'ngo' && (
              <motion.div
                layoutId="register-role-pill"
                className="absolute inset-0 rounded-xl bg-slate-800 border border-slate-700 shadow-md -z-10"
              />
            )}
            <Building2 className="w-4 h-4" />
            <span>NGO / Organization</span>
          </button>
        </div>

        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-3xl bg-slate-950 border border-emerald-500/30 text-center space-y-4 shadow-2xl"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>

            <h3 className="text-xl font-bold text-white">
              Registration Successful
            </h3>

            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your ReliefGrid account has been created successfully.
              {role === 'ngo'
                ? ' Your NGO profile is currently pending verification.'
                : ' You can now access the Operations Center.'}
            </p>

            <div className="pt-3 flex justify-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                Sign In
              </Link>

              <button
                onClick={() => navigate('/home')}
                className="px-4 py-2 rounded-xl bg-cyan-600 text-xs font-bold text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-950"
              >
                Go to Operations Center
              </button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">

              {role === 'individual' ? (
                <motion.div
                  key="individual"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={indForm.fullName}
                        onChange={(e) => setIndForm({ ...indForm, fullName: e.target.value })}
                        placeholder="e.g. Akash Kumar"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={indForm.email}
                        onChange={(e) => setIndForm({ ...indForm, email: e.target.value })}
                        placeholder="akash@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={indForm.phone}
                        onChange={(e) => setIndForm({ ...indForm, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Location / District
                      </label>
                      <input
                        type="text"
                        required
                        value={indForm.location}
                        onChange={(e) => setIndForm({ ...indForm, location: e.target.value })}
                        placeholder="Bhubaneswar, Odisha"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={indForm.password}
                        onChange={(e) => setIndForm({ ...indForm, password: e.target.value })}
                        placeholder="Enter a strong password"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        value={indForm.confirmPassword}
                        onChange={(e) => setIndForm({ ...indForm, confirmPassword: e.target.value })}
                        placeholder="Confirm your password"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                      />
                    </div>

                  </div>
                </motion.div>

              ) : (

                <motion.div
                  key="ngo"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        required
                        value={ngoForm.orgName}
                        onChange={(e) => setNgoForm({ ...ngoForm, orgName: e.target.value })}
                        placeholder="e.g. Coastal Relief Mission Foundation"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Organization Type
                      </label>
                      <select
                        value={ngoForm.orgType}
                        onChange={(e) => setNgoForm({ ...ngoForm, orgType: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white focus:border-emerald-400 focus:outline-none"
                      >
                        <option>Disaster Relief &amp; First Response</option>
                        <option>Emergency Medical &amp; Healthcare</option>
                        <option>Food Bank &amp; Essential Rations</option>
                        <option>Temporary Shelter &amp; Logistics</option>
                        <option>Search, Rescue &amp; Evacuation</option>
                      </select>
                    </div>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Official Registration Number
                      </label>
                      <input
                        type="text"
                        required
                        value={ngoForm.regNumber}
                        onChange={(e) => setNgoForm({ ...ngoForm, regNumber: e.target.value })}
                        placeholder="e.g. NGO/REG/2024/0981"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Authorized Contact Person
                      </label>
                      <input
                        type="text"
                        required
                        value={ngoForm.contactPerson}
                        onChange={(e) => setNgoForm({ ...ngoForm, contactPerson: e.target.value })}
                        placeholder="e.g. Dr. Priya Das (Director)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Official Email
                      </label>
                      <input
                        type="email"
                        required
                        value={ngoForm.email}
                        onChange={(e) => setNgoForm({ ...ngoForm, email: e.target.value })}
                        placeholder="relief@org.org"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white focus:border-emerald-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Emergency Hotline
                      </label>
                      <input
                        type="tel"
                        required
                        value={ngoForm.phone}
                        onChange={(e) => setNgoForm({ ...ngoForm, phone: e.target.value })}
                        placeholder="+91 674 2300000"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white focus:border-emerald-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        HQ Base Location
                      </label>
                      <input
                        type="text"
                        required
                        value={ngoForm.location}
                        onChange={(e) => setNgoForm({ ...ngoForm, location: e.target.value })}
                        placeholder="Cuttack, Odisha"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                      />
                    </div>

                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Proof of Registration Document (PDF / Image)
                    </label>

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-6 text-center bg-slate-950/50 transition-colors cursor-pointer"
                    >
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />

                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
                          <UploadCloud className="w-6 h-6 animate-pulse" />
                        </div>

                        <div className="text-xs text-slate-300">
                          {proofFile ? (
                            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                              <FileText className="w-4 h-4" />
                              <span>{proofFile.name} ({(proofFile.size / 1024).toFixed(1)} KB)</span>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                          ) : (
                            <span>Click to browse or drag &amp; drop registration certificate</span>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-500">
                          Accepts PDF, JPG, PNG up to 10MB
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Coordinator Password
                      </label>
                      <input
                        type="password"
                        required
                        value={ngoForm.password}
                        onChange={(e) => setNgoForm({ ...ngoForm, password: e.target.value })}
                        placeholder="Enter a strong password"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white focus:border-emerald-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        value={ngoForm.confirmPassword}
                        onChange={(e) => setNgoForm({ ...ngoForm, confirmPassword: e.target.value })}
                        placeholder="Confirm your password"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white focus:border-emerald-400 focus:outline-none"
                      />
                    </div>

                  </div>

                </motion.div>
              )}

            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-xl transition-all ${
                loading
                  ? 'bg-slate-700 cursor-not-allowed'
                  : role === 'individual'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-950'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950'
              }`}
            >
              {loading
                ? 'Creating Account...'
                : `Complete Registration (${role === 'individual' ? 'Individual' : 'NGO'})`}
            </motion.button>

          </form>
        )}

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          <span>Already part of the ReliefGrid responder network? </span>
          <Link
            to="/login"
            className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Sign In Here
          </Link>
        </div>

      </motion.div>
    </div>
  )
}
