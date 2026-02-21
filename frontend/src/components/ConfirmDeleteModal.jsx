import { useState } from 'react'

export default function ConfirmDeleteModal({ userName, onConfirm, onCancel, isLoading = false }) {
  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <span className="text-red-600 text-xl">⚠️</span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
          Eliminar Supervisor
        </h3>

        <p className="text-gray-600 text-center mb-6">
          ¿Estás seguro de que deseas eliminar a <strong>{userName}</strong>? Esta acción no se puede deshacer.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {isLoading ? 'Eliminando...' : 'Eliminar'}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
