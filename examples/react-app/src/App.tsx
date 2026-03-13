import PrimaryButton from './components/PrimaryButton';
import Card from './components/Card';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Designer Mode — React Example</h1>
        <p>Press <kbd>Ctrl+Shift+D</kbd> to activate the inspector, then click any element.</p>
      </header>

      <main className="app-main">
        <Card title="Getting Started">
          <p>This is a demo app for Designer Mode. The inspector panel lets you click any element, inspect its styles, and send requests to your AI agent to apply changes.</p>
          <PrimaryButton onClick={() => alert('clicked!')}>Click Me</PrimaryButton>
        </Card>

        <Card title="Typography">
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
          <p>Regular paragraph text with <strong>bold</strong> and <em>italic</em> styling.</p>
          <a href="#" onClick={e => e.preventDefault()}>A link element</a>
        </Card>

        <Card title="Colours">
          <div className="color-swatches">
            <div className="swatch" style={{ background: '#037DD6' }} data-label="Primary" />
            <div className="swatch" style={{ background: '#0260b4' }} data-label="Primary Dark" />
            <div className="swatch" style={{ background: '#f6f8fa' }} data-label="Surface" />
            <div className="swatch" style={{ background: '#1e1e1e' }} data-label="Dark" />
          </div>
        </Card>
      </main>
    </div>
  );
}
