import FullScreenModal from '../../../components/FullScreenModal'
import AuthForm from '../components/AuthForm'

// Popup login cepat dari halaman publik (id="login-username", "login-password", "login-submit").
export default function AuthModal({ open, onClose, onAuthenticated, onRegister }) {
  return (
    <FullScreenModal
      open={open}
      onClose={onClose}
      size="sm"
      eyebrow="Ruang penulis"
      title="Masuk untuk menulis"
      subtitle="Simpan draf, terbitkan, dan gunakan asisten AI."
    >
      <div className="p-5 sm:p-7">
        <AuthForm mode="login" onSuccess={onAuthenticated} onSwitchMode={onRegister} />
      </div>
    </FullScreenModal>
  )
}
