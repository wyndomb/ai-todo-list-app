export function Footer() {
  return (
    <footer className="border-t py-4 px-6 bg-card text-card-foreground">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between text-sm">
        <p>© {new Date().getFullYear()} AI-Powered Todo List</p>
        <div className="flex items-center space-x-4 mt-2 md:mt-0">
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Help</a>
        </div>
      </div>
    </footer>
  );
}