```react
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Wallet, CreditCard, Coins, Lock, Unlock, Loader2, Check } from 'lucide-react';

// --- Configuration Firebase ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [cashAmount, setCashAmount] = useState(0);
  const [bankAmount, setBankAmount] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');

  // --- Initialisation de l'authentification ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Erreur d'authentification:", error);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // --- Chargement des données en temps réel ---
  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'wallet', 'balances');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCashAmount(data.cash || 0);
        setBankAmount(data.bank || 0);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Erreur lors de la récupération des données:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Sauvegarde des données ---
  const saveToCloud = async (cash, bank) => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'wallet', 'balances');
      await setDoc(docRef, { cash: parseFloat(cash) || 0, bank: parseFloat(bank) || 0 }, { merge: true });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error("Erreur de sauvegarde:", error);
      setSaveStatus('error');
    }
  };

  // --- Gestionnaires d'événements ---
  const handleToggleEdit = () => {
    if (isEditing) {
      saveToCloud(cashAmount, bankAmount);
    }
    setIsEditing(!isEditing);
  };

  const handleCashChange = (e) => {
    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
    setCashAmount(val);
    saveToCloud(val, bankAmount);
  };

  const handleBankChange = (e) => {
    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
    setBankAmount(val);
    saveToCloud(cashAmount, val);
  };

  // --- Utilitaires ---
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const totalAmount = (parseFloat(cashAmount) || 0) + (parseFloat(bankAmount) || 0);

  // --- Rendu UI ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    // Fond global avec un dégradé plus vibrant pour contraster avec le verre
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-900 flex flex-col items-center py-8 px-4 font-sans text-white selection:bg-white/30 relative overflow-hidden">
      
      {/* Bulles d'arrière-plan pour accentuer l'effet de transparence du verre */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

      {/* Conteneur principal Verre Lisse (Ultra Clear Glass) */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/30 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden relative z-10 box-border before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/10 before:pointer-events-none">
        
        {/* En-tête : Solde Total */}
        <div className="p-8 pb-10 text-center relative border-b border-white/20 bg-gradient-to-b from-white/10 to-transparent">
          <h1 className="text-sm font-medium text-white/80 tracking-widest uppercase mb-2 drop-shadow-sm">Solde Total</h1>
          <div className="text-4xl sm:text-5xl font-bold flex items-center justify-center gap-3 drop-shadow-lg">
            <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
            {formatMoney(totalAmount)}
          </div>
          
          {/* Indicateur de sauvegarde */}
          <div className="absolute top-4 right-4 text-xs font-medium h-4">
            {saveStatus === 'saving' && <span className="text-white/80 animate-pulse flex items-center gap-1 drop-shadow-sm"><Loader2 className="w-3 h-3 animate-spin"/> Sauvegarde...</span>}
            {saveStatus === 'saved' && <span className="text-cyan-300 flex items-center gap-1 drop-shadow-sm"><Check className="w-3 h-3"/> À jour</span>}
          </div>
        </div>

        {/* Corps de l'application */}
        <div className="p-6 pt-8 space-y-6 relative">
          
          {/* Ligne : Espèces (Verre très clair) */}
          <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden
            ${isEditing 
              ? 'bg-white/20 border-white/50 shadow-[inset_0_0_15px_rgba(255,255,255,0.2)]' 
              : 'bg-gradient-to-br from-white/10 to-white/5 border-t-white/40 border-l-white/40 border-b-white/10 border-r-white/10 hover:bg-white/15'
            }`}>
            {/* Reflet sur le bord supérieur */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>

            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2 text-white/90 font-medium drop-shadow-sm">
                <Coins className="w-5 h-5 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
                Espèces
              </div>
            </div>
            
            {isEditing ? (
              <div className="relative z-10">
                <input
                  type="number"
                  value={cashAmount || ''}
                  onChange={handleCashChange}
                  placeholder="0"
                  className="w-full text-3xl font-bold bg-transparent text-white placeholder-white/40 outline-none pb-2 border-b-2 border-white/40 focus:border-yellow-300 transition-colors drop-shadow-md"
                />
                <span className="absolute right-0 bottom-3 text-xl text-white/60 font-bold">€</span>
              </div>
            ) : (
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {formatMoney(cashAmount)}
              </div>
            )}
          </div>

          {/* Ligne : Bancaire (Verre très clair) */}
          <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden
            ${isEditing 
              ? 'bg-white/20 border-white/50 shadow-[inset_0_0_15px_rgba(255,255,255,0.2)]' 
              : 'bg-gradient-to-br from-white/10 to-white/5 border-t-white/40 border-l-white/40 border-b-white/10 border-r-white/10 hover:bg-white/15'
            }`}>
             {/* Reflet sur le bord supérieur */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>

            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2 text-white/90 font-medium drop-shadow-sm">
                <CreditCard className="w-5 h-5 text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.8)]" />
                Bancaire
              </div>
            </div>
            
            {isEditing ? (
              <div className="relative z-10">
                <input
                  type="number"
                  value={bankAmount || ''}
                  onChange={handleBankChange}
                  placeholder="0"
                  className="w-full text-3xl font-bold bg-transparent text-white placeholder-white/40 outline-none pb-2 border-b-2 border-white/40 focus:border-blue-300 transition-colors drop-shadow-md"
                />
                <span className="absolute right-0 bottom-3 text-xl text-white/60 font-bold">€</span>
              </div>
            ) : (
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {formatMoney(bankAmount)}
              </div>
            )}
          </div>

          {/* Bouton Éditer / Verrouiller (Verre brillant) */}
          <button
            onClick={handleToggleEdit}
            className={`w-full mt-4 py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold tracking-wide transition-all duration-300 active:scale-[0.98] relative overflow-hidden
              ${isEditing 
                ? 'bg-emerald-500/80 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-300 backdrop-blur-md hover:bg-emerald-400/90' 
                : 'bg-gradient-to-r from-white/10 to-white/5 text-white hover:bg-white/20 border-t-white/40 border-l-white/40 border-b-white/10 border-r-white/10 backdrop-blur-md shadow-lg'
              }`}
          >
             {/* Reflet brillant sur le bouton */}
            {!isEditing && <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent opacity-50 pointer-events-none"></div>}

            {isEditing ? (
              <>
                <Lock className="w-4 h-4 drop-shadow-sm" />
                <span className="drop-shadow-sm">Verrouiller & Sauvegarder</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 drop-shadow-sm" />
                <span className="drop-shadow-sm">Déverrouiller pour modifier</span>
              </>
            )}
          </button>
          
        </div>
      </div>
    </div>
  );
}


```
