'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  X, Share, Plus,
  Download, Smartphone, CheckCircle,
  ArrowDown, Globe
} from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

interface PWAInstallGuideProps {
  onDismiss: () => void
}

export function PWAInstallGuide({ onDismiss }: PWAInstallGuideProps) {
  const { deviceType, installState, installAndroid } = usePWAInstall()
  const [step, setStep] = useState(0)
  const [installing, setInstalling] = useState(false)
  const [installed, setInstalled] = useState(false)

  const handleAndroidInstall = async () => {
    setInstalling(true)
    const success = await installAndroid()
    setInstalling(false)
    if (success) setInstalled(true)
  }

  if (installed || installState === 'installed') {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} strokeWidth={1.5} className="text-green-500" />
          </div>
          <h2 className="font-bold text-gray-900 text-lg mb-2"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            App instalado!
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            Encontre o Anfitrião Management na tela inicial do seu celular.
          </p>
          <button
            onClick={onDismiss}
            className="w-full bg-[#1A56DB] text-white font-semibold py-3.5 rounded-2xl"
          >
            Continuar
          </button>
        </div>
      </div>
    )
  }

  if (deviceType === 'android') {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden">

          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <Image src="/icone.png" alt="Anfitrião Management" width={36} height={36} className="rounded-xl object-contain" />
              <div>
                <p className="font-bold text-gray-900 text-sm"
                   style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Anfitrião Management
                </p>
                <p className="text-gray-400 text-xs">Instalar no Android</p>
              </div>
            </div>
            <button onClick={onDismiss} className="p-2 rounded-full hover:bg-gray-100">
              <X size={18} strokeWidth={1.5} className="text-gray-400" />
            </button>
          </div>

          <div className="p-5">
            <div className="space-y-3 mb-6">
              {[
                { icon: Smartphone, text: 'Acesse sem abrir o navegador' },
                { icon: Download, text: 'Não ocupa espaço da loja de apps' },
                { icon: CheckCircle, text: 'Funciona offline quando necessário' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#EFF6FF] rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon size={15} strokeWidth={1.5} className="text-[#1A56DB]" />
                  </div>
                  <p className="text-gray-700 text-sm">{item.text}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleAndroidInstall}
              disabled={installing}
              className="w-full bg-[#1A56DB] text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              <Download size={18} strokeWidth={1.5} />
              {installing ? 'Instalando...' : 'Instalar agora'}
            </button>

            <button
              onClick={onDismiss}
              className="w-full text-gray-400 text-sm py-3 mt-2"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (deviceType === 'ios') {
    const steps = [
      {
        title: 'Toque em Compartilhar',
        description: 'No Safari, toque no ícone de compartilhar na barra inferior do navegador.',
        visual: (
          <div className="bg-gray-900 rounded-2xl p-4 flex items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <ArrowDown size={20} strokeWidth={1.5} className="text-white" />
              </div>
              <span className="text-white/40 text-[10px]">Favoritos</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-[#1A56DB] rounded-xl flex items-center justify-center ring-2 ring-white">
                <Share size={20} strokeWidth={1.5} className="text-white" />
              </div>
              <span className="text-white text-[10px] font-medium">Compartilhar</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Globe size={20} strokeWidth={1.5} className="text-white" />
              </div>
              <span className="text-white/40 text-[10px]">AA</span>
            </div>
          </div>
        ),
      },
      {
        title: 'Adicionar à Tela de Início',
        description: 'Role para baixo no menu e toque em "Adicionar à Tela de Início".',
        visual: (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {[
              { icon: Share, label: 'Compartilhar link', highlight: false },
              { icon: Plus, label: 'Adicionar à Tela de Início', highlight: true },
              { icon: Download, label: 'Salvar no Arquivos', highlight: false },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3.5 ${
                  i < 2 ? 'border-b border-gray-50' : ''
                } ${item.highlight ? 'bg-[#EFF6FF]' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  item.highlight ? 'bg-[#1A56DB]' : 'bg-gray-100'
                }`}>
                  <item.icon size={16} strokeWidth={1.5} className={item.highlight ? 'text-white' : 'text-gray-500'} />
                </div>
                <span className={`text-sm font-medium ${item.highlight ? 'text-[#1A56DB]' : 'text-gray-700'}`}>
                  {item.label}
                </span>
                {item.highlight && (
                  <div className="ml-auto w-2 h-2 bg-[#1A56DB] rounded-full animate-pulse" />
                )}
              </div>
            ))}
          </div>
        ),
      },
      {
        title: 'Toque em Adicionar',
        description: 'Confirme tocando em "Adicionar" no canto superior direito. Pronto!',
        visual: (
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#1A56DB] text-sm font-medium">Cancelar</span>
              <span className="text-gray-900 text-sm font-semibold">Adicionar à Tela de Início</span>
              <div className="bg-[#1A56DB] text-white text-sm font-semibold px-3 py-1 rounded-full">
                Adicionar
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 py-4">
              <Image src="/icone.png" alt="Anfitrião Management" width={56} height={56} className="object-contain rounded-xl" />
              <div className="text-center">
                <p className="font-semibold text-gray-900 text-sm">Anfitrião Management</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {typeof window !== 'undefined' ? window.location.hostname : 'anfitriao-management.vercel.app'}
                </p>
              </div>
            </div>
          </div>
        ),
      },
    ]

    const currentStep = steps[step]

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden">

          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <Image src="/icone.png" alt="Anfitrião Management" width={36} height={36} className="rounded-xl object-contain" />
              <div>
                <p className="font-bold text-gray-900 text-sm"
                   style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Instalar no iPhone
                </p>
                <p className="text-gray-400 text-xs">Passo {step + 1} de {steps.length}</p>
              </div>
            </div>
            <button onClick={onDismiss} className="p-2 rounded-full hover:bg-gray-100">
              <X size={18} strokeWidth={1.5} className="text-gray-400" />
            </button>
          </div>

          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-[#1A56DB] transition-all duration-300"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="p-5">
            <div className="mb-4">
              {currentStep.visual}
            </div>

            <h3 className="font-bold text-gray-900 text-base mb-1"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {currentStep.title}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              {currentStep.description}
            </p>

            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm"
                >
                  Voltar
                </button>
              )}
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="flex-1 bg-[#1A56DB] text-white font-semibold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-all"
                >
                  Próximo
                </button>
              ) : (
                <button
                  onClick={onDismiss}
                  className="flex-1 bg-[#1A56DB] text-white font-semibold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-all"
                >
                  Concluir
                </button>
              )}
            </div>

            <button
              onClick={onDismiss}
              className="w-full text-gray-300 text-xs py-2 mt-1"
            >
              Instalar depois
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
