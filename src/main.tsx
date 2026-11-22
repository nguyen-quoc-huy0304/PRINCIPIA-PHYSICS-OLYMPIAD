import { render } from 'preact';
import { App } from './app/App';
import './styles/app.css';
import { migrateLegacyV1Storage } from './core/legacy-migration';

try { migrateLegacyV1Storage(); } catch (error) { console.error('PRINCIPIA data migration failed safely:', error); }

const root = document.getElementById('app');
if (!root) throw new Error('PRINCIPIA root element is missing');
render(<App />, root);