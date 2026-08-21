import './globals.css';
import ClientProvider from '../components/providers/ClientProvider';

export const metadata = {
  title: 'NexusChat - Real-Time Messaging Platform',
  description: 'Enterprise-grade real-time messaging application built on MERN stack and Socket.IO.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-100 antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
