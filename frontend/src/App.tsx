import MultiStepBRDForm from "./components/MultiStepBRDForm";

function App() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-sky-700">
          Business Requirements Document
        </h1>
      </header>
      <main>
        <MultiStepBRDForm />
      </main>
      <footer className="text-center mt-10 text-sm text-slate-500"></footer>
    </div>
  );
}

export default App;
