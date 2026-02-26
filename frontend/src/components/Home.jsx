import { useNavigate } from 'react-router-dom';

export default function Home({ user }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/Mesa de trabajo 1 (3).png" className="h-20 object-contain" />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#servicios" className="text-sm text-gray-600 hover:text-blue-600">
              Servicios
            </a>
            <a href="#empresa" className="text-sm text-gray-600 hover:text-blue-600">
              Sobre Nosotros
            </a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.username}</span>
                <a
                  href={user.role === 'admin' ? '/admin' : '/dashboard'}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Ingresar
                </a>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Ingresar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative h-96 bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: 'url(/images/Fondo1.png)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        <div className="relative max-w-6xl mx-auto px-6 h-full flex flex-col justify-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 max-w-xl">
            Construimos soluciones que perduran
          </h2>
          <p className="text-gray-100 mb-6 max-w-xl text-lg">
            Ingeniería y arquitectura con excelencia técnica, ética y compromiso con la
            sostenibilidad.
          </p>
          <button
            onClick={() =>
              document.getElementById('servicios').scrollIntoView({ behavior: 'smooth' })
            }
            className="w-fit bg-white text-gray-900 px-6 py-3 rounded font-semibold hover:bg-gray-100 transition"
          >
            Ver Portafolio
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-3xl font-bold text-blue-600">10+</p>
              <p className="text-xs text-gray-500 uppercase mt-2">Años de Experiencia</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-3xl font-bold text-blue-600">120+</p>
              <p className="text-xs text-gray-500 uppercase mt-2">Proyectos Completados</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-3xl font-bold text-blue-600">50+</p>
              <p className="text-xs text-gray-500 uppercase mt-2">Clientes Satisfechos</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-3xl font-bold text-blue-600">100%</p>
              <p className="text-xs text-gray-500 uppercase mt-2">Compromiso y Calidad</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide">
              Lo que hacemos
            </p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">Nuestros Servicios</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 text-xl">✓</span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Excelencia Técnica</h4>
              <p className="text-gray-600 text-sm">
                Implementamos los más altos estándares de calidad técnica en cada fase del proyecto,
                garantizando seguridad y precisión en la ejecución estructural.
              </p>
            </div>

            {/* Service 2 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 text-xl">🌱</span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Ingeniería Sostenible</h4>
              <p className="text-gray-600 text-sm">
                Priorizamos el valor a largo plazo y la ética profesional, integrando soluciones
                eficientes que respetan el entorno y optimizan recursos.
              </p>
            </div>

            {/* Service 3 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 text-xl">💡</span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Innovación Continua</h4>
              <p className="text-gray-600 text-sm">
                Nuestro equipo se mantiene en constante formación, aplicando tecnologías de
                vanguardia y metodologías ágiles en soluciones de ingeniería.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="empresa" className="bg-blue-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide">
                Sobre Proyectos RMM
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2 mb-4">
                Socios Estratégicos en Infraestructura
              </h3>
              <p className="text-gray-700 mb-4">
                Con más de una década de experiencia, Proyectos RMM se ha consolidado como un
                referente en ingeniería y arquitectura de alto impacto, especializados en
                infraestructuras resilientes y sostenibles.
              </p>
              <p className="text-gray-700">
                Nuestro equipo multidisciplinario combina expertise técnica con compromiso ético,
                entregando soluciones que trascienden y perduran en el tiempo.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-900">Misión</p>
                  <p className="text-gray-600 text-sm">
                    Desarrollar proyectos de ingeniería y arquitectura que generen valor sostenible
                    para nuestros clientes y comunidades.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Visión</p>
                  <p className="text-gray-600 text-sm">
                    Ser líderes en soluciones de infraestructura innovadora y sostenible en América
                    Latina.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Valores</p>
                  <p className="text-gray-600 text-sm">
                    Excelencia, Integridad, Innovación, Sostenibilidad y Compromiso con la Calidad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">¿Listo para Comenzar?</h3>
          <p className="text-blue-100 mb-6">
            Únete a nuestro portal y gestiona tus proyectos de forma eficiente.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3 bg-white text-blue-600 rounded font-semibold hover:bg-gray-100 transition"
            >
              Crear Cuenta
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-blue-700 text-white rounded font-semibold hover:bg-blue-800 transition border-2 border-white"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <p className="text-white font-semibold">Proyectos RMM</p>
              <p className="text-sm">Ingeniería y Arquitectura</p>
            </div>
            <div className="flex gap-6 text-sm mt-4 md:mt-0">
              <a href="#" className="hover:text-white">
                Privacidad
              </a>
              <a href="#" className="hover:text-white">
                Términos
              </a>
              <a href="#" className="hover:text-white">
                Contacto
              </a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm">
            <p>© 2026 Proyectos RMM. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
