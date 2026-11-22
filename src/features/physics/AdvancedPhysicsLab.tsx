import { calculateAdvancedPhysics, type AdvancedPhysicsTool } from '../../core/physics';
import { useState } from 'preact/hooks';

type Field = { key: string; label: string; unit: string; initial: string };
type Tool = { id: string; title: string; description: string; fields: Field[]; calculate: (values: number[]) => Array<[string, number, string]> };

const tools: Tool[] = [
  { id: 'newton', title: 'Định luật II Newton', description: 'Tính hợp lực, khối lượng hoặc gia tốc theo F = ma.', fields: [{key:'m',label:'Khối lượng m',unit:'kg',initial:'2'},{key:'a',label:'Gia tốc a',unit:'m/s²',initial:'3'}], calculate: ([m,a]) => [['Hợp lực F = ma',m*a,'N']] },
  { id: 'work', title: 'Công và công suất', description: 'Công của lực không đổi và công suất trung bình.', fields: [{key:'f',label:'Lực F',unit:'N',initial:'20'},{key:'s',label:'Độ dời s',unit:'m',initial:'5'},{key:'angle',label:'Góc α',unit:'°',initial:'30'},{key:'time',label:'Thời gian',unit:'s',initial:'4'}], calculate: ([f,s,angle,time]) => { const work=f*s*Math.cos(angle*Math.PI/180); return [['Công A',work,'J'],['Công suất P = A/t',time>0?work/time:NaN,'W']]; } },
  { id: 'momentum', title: 'Động lượng và xung lượng', description: 'Tính p = mv và xung lượng I = FΔt.', fields: [{key:'m',label:'Khối lượng m',unit:'kg',initial:'0.5'},{key:'v',label:'Vận tốc v',unit:'m/s',initial:'8'},{key:'f',label:'Lực trung bình F',unit:'N',initial:'10'},{key:'dt',label:'Thời gian tác dụng Δt',unit:'s',initial:'0.2'}], calculate: ([m,v,f,dt]) => [['Động lượng p = mv',m*v,'kg·m/s'],['Xung lượng I = FΔt',f*dt,'N·s']] },
  { id: 'ohm', title: 'Định luật Ohm', description: 'Tính cường độ dòng điện, điện trở và công suất.', fields: [{key:'u',label:'Hiệu điện thế U',unit:'V',initial:'12'},{key:'r',label:'Điện trở R',unit:'Ω',initial:'6'}], calculate: ([u,r]) => [['Dòng điện I = U/R',r!==0?u/r:NaN,'A'],['Công suất P = UI',r!==0?u*u/r:NaN,'W']] },
  { id: 'thermal', title: 'Nhiệt lượng', description: 'Tính Q = mcΔT khi không xảy ra chuyển thể.', fields: [{key:'m',label:'Khối lượng m',unit:'kg',initial:'1'},{key:'c',label:'Nhiệt dung riêng c',unit:'J/(kg·K)',initial:'4200'},{key:'delta',label:'Độ biến thiên nhiệt độ ΔT',unit:'K hoặc °C',initial:'10'}], calculate: ([m,c,d]) => [['Nhiệt lượng Q = mcΔT',m*c*d,'J']] },
  { id: 'wave', title: 'Sóng cơ', description: 'Liên hệ vận tốc truyền sóng, bước sóng và tần số.', fields: [{key:'lambda',label:'Bước sóng λ',unit:'m',initial:'2'},{key:'f',label:'Tần số f',unit:'Hz',initial:'5'}], calculate: ([l,f]) => [['Vận tốc truyền sóng v = λf',l*f,'m/s'],['Chu kỳ T = 1/f',f>0?1/f:NaN,'s']] }
];

export function AdvancedPhysicsLab() {
  const [values, setValues] = useState<Record<string, Record<string,string>>>(() => Object.fromEntries(tools.map(tool => [tool.id, Object.fromEntries(tool.fields.map(field => [field.key,field.initial]))])));
  const [active, setActive] = useState('newton');
  const [result, setResult] = useState<Array<[string,number,string]> | null>(null);
  const [error, setError] = useState('');
  const tool = tools.find(item => item.id === active)!;
  const calculate = async () => {
    const inputs = tool.fields.map(field => Number(values[tool.id]?.[field.key]));
    if (inputs.some(value => !Number.isFinite(value))) { setError('Hãy nhập đầy đủ các giá trị là số hữu hạn.'); setResult(null); return; }
    try {
      const computed = await calculateAdvancedPhysics(tool.id as AdvancedPhysicsTool, inputs);
      const labels: Record<string, Array<[string, string]>> = {
        newton: [['Hợp lực F = ma', 'N']],
        work: [['Công A', 'J'], ['Công suất P = A/t', 'W']],
        momentum: [['Động lượng p = mv', 'kg·m/s'], ['Xung lượng I = FΔt', 'N·s']],
        ohm: [['Dòng điện I = U/R', 'A'], ['Công suất P = UI', 'W']],
        thermal: [['Nhiệt lượng Q = mcΔT', 'J']],
        wave: [['Vận tốc truyền sóng v = λf', 'm/s'], ['Chu kỳ T = 1/f', 's']]
      };
      const output = computed.map((value, index) => [labels[tool.id][index][0], value, labels[tool.id][index][1]] as [string, number, string]);
      if (output.some(([,value]) => !Number.isFinite(value))) throw new Error('Giá trị đầu vào không hợp lệ (ví dụ: mẫu số bằng 0).');
      setResult(output); setError('');
    } catch (reason) { setResult(null); setError(reason instanceof Error ? reason.message : 'Không thể tính kết quả.'); }
  };
  return <section class="advanced-physics">
    <div class="advanced-physics-heading"><div><h2>Công cụ tính nhanh</h2><p>Sáu mô-đun tính toán bổ sung cho cơ học, điện học, nhiệt học và sóng.</p></div><span>V2 · TypeScript</span></div>
    <div class="physics-tool-tabs">{tools.map(item => <button type="button" class={active===item.id?'active':''} onClick={() => {setActive(item.id);setResult(null);setError('');}}>{item.title}</button>)}</div>
    <article class="physics-card advanced-physics-card">
      <h3>{tool.title}</h3><p>{tool.description}</p>
      <div class="physics-inputs">{tool.fields.map(field => <label>{field.label} ({field.unit})<input type="number" step="any" value={values[tool.id]?.[field.key] ?? field.initial} onInput={event => setValues(current => ({...current,[tool.id]:{...current[tool.id],[field.key]:event.currentTarget.value}}))} /></label>)}</div>
      <button class="primary-button" type="button" onClick={calculate}>Tính kết quả</button>
      {error && <p class="workspace-notice" role="alert">{error}</p>}
      {result && <div class="physics-result">{result.map(([label,value,unit]) => <span>{label}: <b>{value.toLocaleString('vi-VN',{maximumFractionDigits:6})} {unit}</b></span>)}</div>}
    </article>
  </section>;
}
