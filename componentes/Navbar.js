// componets de Nav Bar
import Link from "next/link";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/router";


export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
      <div className="flex gap-4">
        <Link href="/" className="hover:underline">Inicio</Link>
        <Link href="/admin" className="hover:underline">Admin</Link>
      </div>
      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
      >
        Cerrar sesión
      </button>
    </nav>
  );
}