export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Über uns</h3>
            <p className="text-gray-400">
              Wir helfen Singles seit fast 10 Jahren, die perfekte Dating-Plattform zu finden.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Kontakt</h3>
            <p className="text-gray-400">info@singleboersen-aktuell.de</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Links</h3>
            <ul className="text-gray-400">
              <li className="mb-2">
                <a href="#" className="hover:text-white">Impressum</a>
              </li>
              <li className="mb-2">
                <a href="#" className="hover:text-white">Datenschutz</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};