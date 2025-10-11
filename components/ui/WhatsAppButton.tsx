'use client';
import { MessageCircle } from 'lucide-react';
import { COMPANY_INFO } from '@/lib/constants';

export default function WhatsAppButton() {
  const whatsappNumber = COMPANY_INFO.whatsapp;
  const message = 'Hello, I am interested in your vehicles';

  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center"
      aria-label="Contact on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="sr-only">Contact on WhatsApp</span>
    </a>
  );
}