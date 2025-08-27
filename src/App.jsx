import PDFGenerator from './components/PDFGenerator';

function App() {
  const handleGeneratePDF = async () => {
    const pdfGenerator = new PDFGenerator();
    await pdfGenerator.generatePDF();
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      gap: '20px'
    }}>
      <h1>Quote</h1>
      <button 
        onClick={handleGeneratePDF}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#6B4C8A',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#5a3f75'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#6B4C8A'}
      >
        Download Quote PDF
      </button>
    </div>
  )
}

export default App