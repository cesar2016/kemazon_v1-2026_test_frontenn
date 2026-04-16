import React from 'react';
import { Modal } from '../ui';
import { User, Globe } from 'lucide-react';

export function LikersModal({ isOpen, onClose, likers, isLoading, title = "A quienes les gusta", emptyMessage = "Aún nadie le ha dado me gusta a este producto." }) {
    const safeLikers = Array.isArray(likers) ? likers : (likers ? Object.values(likers) : []);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
        >
            <div className="max-h-96 overflow-y-auto pr-2">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : safeLikers && safeLikers.length > 0 ? (
                    <div className="space-y-4">
                        {safeLikers.map((liker, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                    {liker.avatar ? (
                                        <img src={liker.avatar} alt={liker.name} className="w-full h-full object-cover" />
                                    ) : liker.type === 'user' ? (
                                        <User className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <Globe className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {liker.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {liker.type === 'user' ? 'Usuario registrado' : 'Visitante'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        {emptyMessage}
                    </div>
                )}
            </div>
        </Modal>
    );
}
