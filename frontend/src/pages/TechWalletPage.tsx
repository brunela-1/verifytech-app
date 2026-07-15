import React, { useEffect, useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { getWalletBalance, requestRecharge, WalletBalanceData } from '../api/wallet';
import TopNavBar from '../components/TopNavBar';

export default function TechWalletPage() {
  const { user } = useAuth();
  const [data, setData] = useState<WalletBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchWallet = async () => {
    try {
      const res = await getWalletBalance();
      setData(res.data);
    } catch (err) {
      console.error('Error fetching wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Monto inválido');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      // Auto-generar número de operación para la simulación
      const autoReference = 'SIM-' + Math.floor(10000000 + Math.random() * 90000000).toString();
      
      await requestRecharge(Number(amount), autoReference);
      setShowRechargeModal(false);
      setAmount('');
      await fetchWallet();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al solicitar recarga');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-orange-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'recharge': return 'Recarga (Yape/Plin)';
      case 'commission': return 'Comisión por Servicio';
      case 'subscription': return 'Suscripción VIP';
      case 'bonus': return 'Bono de Bienvenida';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-[#191c1e]">Mi Billetera</h1>
            <p className="text-[#505f76] mt-1">Gestiona tu saldo para seguir enviando propuestas</p>
          </div>
          <button
            onClick={() => setShowRechargeModal(true)}
            className="btn btn-primary"
          >
            Recargar Saldo
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[#004ac6] to-[#003ea8] rounded-3xl p-8 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-6 h-6 text-blue-200" />
              <span className="font-semibold text-blue-100">Saldo Actual</span>
            </div>
            {loading ? (
              <div className="h-12 w-32 bg-white/20 animate-pulse rounded-lg mt-2"></div>
            ) : (
              <div className="flex items-end gap-3">
                <span className="text-5xl font-black">
                  S/ {data?.balance.toFixed(2)}
                </span>
                {data?.balance && data.balance <= 0 ? (
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
                    Saldo Agotado
                  </span>
                ) : null}
              </div>
            )}
            <p className="mt-4 text-blue-100 text-sm max-w-md">
              Recuerda que se descontará automáticamente una comisión del 15% del precio de tu propuesta cada vez que un cliente la acepte.
            </p>
          </div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Transactions */}
        <h2 className="text-xl font-bold text-[#191c1e] mb-4">Movimientos</h2>
        <div className="bg-white rounded-2xl border border-[#eceef0] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando movimientos...</div>
          ) : data?.transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No tienes movimientos en tu billetera.
            </div>
          ) : (
            <ul className="divide-y divide-[#eceef0]">
              {data?.transactions.map(tx => (
                <li key={tx.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {tx.amount > 0 ? (
                        <ArrowDownRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[#191c1e]">{getTypeLabel(tx.type)}</p>
                      <div className="flex items-center gap-2 text-sm text-[#505f76] mt-0.5">
                        <span>{new Date(tx.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        {tx.reference && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs">Ref: {tx.reference}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-lg ${tx.amount > 0 ? 'text-green-600' : 'text-[#191c1e]'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {getStatusIcon(tx.status)}
                      <span className="text-xs font-semibold text-gray-500">{getStatusLabel(tx.status)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowRechargeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-black text-[#191c1e] mb-2">Recargar Saldo</h2>
            <p className="text-sm text-[#505f76] mb-6">Transfiere a través de Yape o Plin al número oficial y registra aquí el N° de Operación.</p>

            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-6 flex flex-col items-center">
              <div className="w-32 h-32 bg-gray-200 rounded-xl mb-3 flex items-center justify-center">
                <span className="text-gray-400 font-bold text-sm">QR AQUI</span>
              </div>
              <p className="font-bold text-lg text-center">987 654 321</p>
              <p className="text-xs text-gray-500 text-center">A nombre de: TechTrust S.A.C.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-xl mb-4 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleRecharge} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#191c1e] mb-1.5">Monto Recargado (S/)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  className="input w-full"
                  placeholder="Ej: 20.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={submitting}
                />
              </div>
              
              <button
                type="submit"
                className="btn btn-primary w-full mt-2"
                disabled={submitting}
              >
                {submitting ? 'Enviando...' : 'Recargar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
