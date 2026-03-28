import { useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  // 404 logged silently - no sensitive info exposed

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Halaman tidak ditemukan</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Kembali ke Beranda
        </a>
      </div>
    </div>
  );
};

export default NotFound;
