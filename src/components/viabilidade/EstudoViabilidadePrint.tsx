import React from 'react';
import { PRESETS_AREAS, type ViabilidadeInicialInput, type ViabilidadeInicialResult } from '../../lib/viabilidade-inicial';
import { DonutSVG, BarSVG, SCurveSVG } from './ViabilidadeCharts';
import { formatBRL, formatDecimal, pctSobre } from './formatters';

interface Props {
  input: ViabilidadeInicialInput;
  resultado: ViabilidadeInicialResult;
}

export const EstudoViabilidadePrint: React.FC<Props> = ({ input, resultado: r }) => {
  const terreno = input.areaTerreno;
  const areaPct = (m2: number) => formatDecimal(pctSobre(m2, terreno));

  return (
    <div className="hidden print:block bg-white text-slate-900 w-full">
      <div className="w-full" style={{ pageBreakAfter: 'always', breakAfter: 'page', padding: '15px' }}>
        <table style={{ width: '100%', borderBottom: '4px solid #1e3a8a', paddingBottom: '12px', marginBottom: '20px' }}>
          <tbody>
            <tr>
              <td style={{ width: '33%', textAlign: 'left', verticalAlign: 'middle' }}>
                <img src="/logo-spechotto.png" alt="Spechotto" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} />
              </td>
              <td style={{ width: '34%', textAlign: 'center', verticalAlign: 'middle' }}>
                <h1 style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', margin: 0 }}>ESTUDO DE VIABILIDADE INICIAL</h1>
                <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', margin: '4px 0 0 0' }}>Análise Econômica e Urbanística</p>
              </td>
              <td style={{ width: '33%', textAlign: 'right', verticalAlign: 'middle' }}>
                <img src="/logo-meurbanismo.jpg" alt="meUrbanismo" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#334155', marginBottom: '16px', textAlign: 'justify' }}>
          <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '10px' }}>
            Cuiabá, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
          </div>
          <p><strong>Aos cuidados de:</strong> {input.destinatario || 'Cliente / Investidor'}</p>
          <p style={{ marginTop: '3px' }}><strong>Assunto:</strong> Estudo de Viabilidade Inicial — {input.obraNome || 'Novo Empreendimento'} ({input.localizacao || 'Cuiabá - MT'})</p>
          <p style={{ marginTop: '10px' }}>Prezado(a),</p>
          <p style={{ marginTop: '5px' }}>Em atendimento a vossa solicitação, apresentamos a seguir o <strong>Estudo de Viabilidade Inicial</strong> para o empreendimento denominado <strong>{input.obraNome || 'Não definido'}</strong>, localizado na cidade de <strong>{input.localizacao || 'Cuiabá - MT'}</strong>.</p>
          <p style={{ marginTop: '5px' }}>Aproveitamos a oportunidade para reafirmar nosso compromisso em atendê-los com os mais elevados níveis de qualidade. Agradecemos a confiança depositada e nos colocamos à disposição para os esclarecimentos necessários.</p>
        </div>

        <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#334155', textAlign: 'justify' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', borderBottom: '1px solid #1e3a8a', paddingBottom: '3px', marginBottom: '6px', textTransform: 'uppercase' }}>Considerações Iniciais</h3>
          <p style={{ marginBottom: '6px' }}>O estudo foi elaborado de forma estimada e prévia, com parâmetros mínimos de projeto e metragens informadas. Um estudo detalhado exige projeto preliminar e definições legais do município, principalmente ambientais e de APP.</p>
          <p>Quando houver APP, recomenda-se adquirir a área de doação obrigatória externamente ao empreendimento, para não reduzir a área vendável. A infraestrutura básica deve contemplar drenagem, água, esgoto, pavimentação, energia e iluminação.</p>
        </div>
      </div>

      <div className="w-full" style={{ pageBreakAfter: 'always', breakAfter: 'page', padding: '15px' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a', borderBottom: '2px solid #1e3a8a', paddingBottom: '5px', marginBottom: '14px', textTransform: 'uppercase' }}>Sumário Executivo e Métricas Numéricas</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '48%', verticalAlign: 'top', paddingRight: '12px' }}>
                <h3 style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#1e3a8a', borderBottom: '1px solid #1e3a8a', paddingBottom: '3px', marginBottom: '6px', textTransform: 'uppercase' }}>Quadro de Áreas</h3>
                <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                      <th style={{ padding: '3px 5px', textAlign: 'left' }}>Destinação</th>
                      <th style={{ padding: '3px 5px', textAlign: 'right' }}>Área (m²)</th>
                      <th style={{ padding: '3px 5px', textAlign: 'right' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: '#f8fafc' }}><td style={{ padding: '3px 5px', fontWeight: 'bold' }}>Área total da gleba</td><td style={{ padding: '3px 5px', textAlign: 'right', fontWeight: 'bold' }}>{formatDecimal(terreno)}</td><td style={{ padding: '3px 5px', textAlign: 'right' }}>100%</td></tr>
                    <tr><td style={{ padding: '3px 5px' }}>Área de APP (deduzida)</td><td style={{ padding: '3px 5px', textAlign: 'right', color: '#dc2626' }}>{formatDecimal(input.areaApp)}</td><td style={{ padding: '3px 5px', textAlign: 'right', color: '#dc2626' }}>{areaPct(input.areaApp)}%</td></tr>
                    <tr style={{ backgroundColor: '#f1f5f9' }}><td style={{ padding: '3px 5px', fontWeight: 'bold' }}>Área útil (após APP)</td><td style={{ padding: '3px 5px', textAlign: 'right', fontWeight: 'bold' }}>{formatDecimal(r.areaBase)}</td><td style={{ padding: '3px 5px', textAlign: 'right', fontWeight: 'bold' }}>{areaPct(r.areaBase)}%</td></tr>
                    <tr><td style={{ padding: '3px 5px' }}>Sistema Viário</td><td style={{ padding: '3px 5px', textAlign: 'right' }}>{formatDecimal((input.percentuais.viario / 100) * r.areaBase)}</td><td style={{ padding: '3px 5px', textAlign: 'right' }}>{areaPct((input.percentuais.viario / 100) * r.areaBase)}%</td></tr>
                    <tr><td style={{ padding: '3px 5px' }}>Áreas Verdes e Lazer</td><td style={{ padding: '3px 5px', textAlign: 'right' }}>{formatDecimal((input.percentuais.verde / 100) * r.areaBase)}</td><td style={{ padding: '3px 5px', textAlign: 'right' }}>{areaPct((input.percentuais.verde / 100) * r.areaBase)}%</td></tr>
                    <tr><td style={{ padding: '3px 5px' }}>Áreas Institucionais</td><td style={{ padding: '3px 5px', textAlign: 'right' }}>{formatDecimal((input.percentuais.institucional / 100) * r.areaBase)}</td><td style={{ padding: '3px 5px', textAlign: 'right' }}>{areaPct((input.percentuais.institucional / 100) * r.areaBase)}%</td></tr>
                    <tr style={{ backgroundColor: '#eff6ff', borderTop: '2px solid #93c5fd' }}><td style={{ padding: '3px 5px', fontWeight: 900, color: '#1e3a8a' }}>Área privativa (Vendável)</td><td style={{ padding: '3px 5px', textAlign: 'right', fontWeight: 900, color: '#1e3a8a' }}>{formatDecimal(r.areaVendavel)}</td><td style={{ padding: '3px 5px', textAlign: 'right', fontWeight: 900, color: '#1e3a8a' }}>{formatDecimal(r.aproveitamentoPct)}%</td></tr>
                    <tr><td style={{ padding: '3px 5px', fontWeight: 'bold' }}>Lotes estimados</td><td style={{ padding: '3px 5px', textAlign: 'right', fontWeight: 'bold' }}>{r.qtdLotes} lotes</td><td style={{ padding: '3px 5px', textAlign: 'right' }}>{formatDecimal(input.loteMedio)} m²</td></tr>
                  </tbody>
                </table>
              </td>
              <td style={{ width: '48%', verticalAlign: 'top', paddingLeft: '12px' }}>
                <h3 style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#1e3a8a', borderBottom: '1px solid #1e3a8a', paddingBottom: '3px', marginBottom: '6px', textTransform: 'uppercase' }}>Indicadores Financeiros</h3>
                <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                      <th style={{ padding: '3px 5px', textAlign: 'left' }}>Métrica</th>
                      <th style={{ padding: '3px 5px', textAlign: 'right' }}>Valor Estimado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td style={{ padding: '2.5px 5px' }}>Custo Ref. por m² privativo</td><td style={{ padding: '2.5px 5px', textAlign: 'right', fontWeight: 'bold' }}>{formatBRL(input.custoM2Privativo)}</td></tr>
                    <tr style={{ backgroundColor: '#f8fafc' }}><td style={{ padding: '2.5px 5px' }}>Venda Ref. por m² privativo</td><td style={{ padding: '2.5px 5px', textAlign: 'right', fontWeight: 'bold' }}>{formatBRL(input.valorVendaM2)}</td></tr>
                    <tr><td style={{ padding: '2.5px 5px' }}>Custo médio por lote</td><td style={{ padding: '2.5px 5px', textAlign: 'right', fontWeight: 'bold' }}>{formatBRL(r.custoPorLote)}</td></tr>
                    <tr style={{ backgroundColor: '#f8fafc' }}><td style={{ padding: '2.5px 5px' }}>Venda média por lote</td><td style={{ padding: '2.5px 5px', textAlign: 'right', fontWeight: 'bold' }}>{formatBRL(r.valorVendaLote)}</td></tr>
                    <tr style={{ backgroundColor: '#fef2f2' }}><td style={{ padding: '2.5px 5px', fontWeight: 'bold' }}>Custo Total da Obra</td><td style={{ padding: '2.5px 5px', textAlign: 'right', fontWeight: 900, color: '#b91c1c' }}>{formatBRL(r.custoTotal)}</td></tr>
                    <tr style={{ backgroundColor: '#ecfdf5' }}><td style={{ padding: '2.5px 5px', fontWeight: 'bold' }}>VGV Total Estimado</td><td style={{ padding: '2.5px 5px', textAlign: 'right', fontWeight: 900, color: '#047857' }}>{formatBRL(r.vgvTotal)}</td></tr>
                    <tr><td style={{ padding: '2.5px 5px', fontWeight: 'bold' }}>Margem Bruta (R$)</td><td style={{ padding: '2.5px 5px', textAlign: 'right', fontWeight: 'bold' }}>{formatBRL(r.margemBruta)}</td></tr>
                    <tr style={{ backgroundColor: '#f8fafc' }}><td style={{ padding: '2.5px 5px', fontWeight: 'bold' }}>Margem sobre VGV (%)</td><td style={{ padding: '2.5px 5px', textAlign: 'right', fontWeight: 'bold' }}>{r.margemPct.toFixed(2)}%</td></tr>
                    <tr style={{ backgroundColor: '#eff6ff' }}><td style={{ padding: '2.5px 5px', fontWeight: 'bold', color: '#1e3a8a' }}>ROI Inicial Estimado</td><td style={{ padding: '2.5px 5px', textAlign: 'right', fontWeight: 900, color: '#1e3a8a' }}>{r.roi.toFixed(2)}%</td></tr>
                    <tr><td style={{ padding: '2.5px 5px' }}>TIR Anual Aproximada</td><td style={{ padding: '2.5px 5px', textAlign: 'right', fontWeight: 'bold' }}>{r.tirAnual !== null ? `${r.tirAnual.toFixed(2)}%` : 'n/a'}</td></tr>
                    <tr style={{ backgroundColor: '#f8fafc' }}><td style={{ padding: '2.5px 5px' }}>VPL (TMA {input.taxaDescontoAA}% a.a.)</td><td style={{ padding: '2.5px 5px', textAlign: 'right', fontWeight: 'bold' }}>{formatBRL(r.vpl)}</td></tr>
                    <tr><td style={{ padding: '2.5px 5px' }}>Prazos (Obra / Vendas)</td><td style={{ padding: '2.5px 5px', textAlign: 'right', fontWeight: 'bold' }}>{input.prazoObraMeses} / {input.prazoVendasMeses} meses</td></tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="w-full" style={{ pageBreakAfter: 'always', breakAfter: 'page', padding: '15px' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a', borderBottom: '2px solid #1e3a8a', paddingBottom: '5px', marginBottom: '14px', textTransform: 'uppercase' }}>Análise Gráfica e Fluxo de Caixa</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
          <tbody>
            <tr>
              <td style={{ width: '48%', verticalAlign: 'top', border: '1px solid #cbd5e1', padding: '10px', backgroundColor: '#f8fafc' }}>
                <h4 style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#0f172a', textAlign: 'center', textTransform: 'uppercase', marginBottom: '6px' }}>Uso do Solo (Áreas)</h4>
                <DonutSVG animar={false} values={[r.pctVendavel, input.percentuais.viario, input.percentuais.verde, input.percentuais.institucional]} colors={['#1e3a8a', '#3b82f6', '#10b981', '#94a3b8']} />
                <table style={{ width: '100%', marginTop: '8px', fontSize: '9px', color: '#334155' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '2px' }}>■ Vendável: <strong>{r.pctVendavel.toFixed(1)}%</strong></td>
                      <td style={{ padding: '2px' }}>■ Viário: <strong>{input.percentuais.viario.toFixed(1)}%</strong></td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px' }}>■ Verdes: <strong>{input.percentuais.verde.toFixed(1)}%</strong></td>
                      <td style={{ padding: '2px' }}>■ Inst.: <strong>{input.percentuais.institucional.toFixed(1)}%</strong></td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={{ width: '4%' }} />
              <td style={{ width: '48%', verticalAlign: 'top', border: '1px solid #cbd5e1', padding: '10px', backgroundColor: '#f8fafc' }}>
                <h4 style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#0f172a', textAlign: 'center', textTransform: 'uppercase', marginBottom: '6px' }}>Custo × VGV × Margem</h4>
                <BarSVG animar={false} c={r.custoTotal} v={r.vgvTotal} m={r.margemBruta} />
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ border: '1px solid #cbd5e1', padding: '12px', backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h4 style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', margin: 0 }}>Curva S — Fluxo de Caixa Acumulado</h4>
            <span style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#1e3a8a', backgroundColor: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>
              TIR Anual: {r.tirAnual !== null ? `${r.tirAnual.toFixed(2)}%` : 'n/a'}
            </span>
          </div>
          <SCurveSVG animar={false} data={r.graficoFluxo} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginTop: '6px' }}>
            <span style={{ width: '33%', textAlign: 'left' }}>Início da Obra</span>
            {r.mesBreakEven !== null ? <span style={{ width: '34%', textAlign: 'center', color: '#059669' }}>Break-even (Mês {r.mesBreakEven})</span> : <span style={{ width: '34%' }} />}
            <span style={{ width: '33%', textAlign: 'right' }}>Fim dos Recebimentos (Mês {r.graficoFluxo.length - 1})</span>
          </div>
        </div>
      </div>

      <div className="w-full" style={{ padding: '15px' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a', borderBottom: '2px solid #1e3a8a', paddingBottom: '5px', marginBottom: '14px', textTransform: 'uppercase' }}>Fundamentação Técnica</h2>
        <div style={{ fontSize: '10.5px', lineHeight: '1.4', color: '#334155', textAlign: 'justify' }}>
          <p style={{ marginBottom: '6px' }}><strong>Eficiência Média de Mercado:</strong> a área vendável sobre a área útil situa-se historicamente entre <strong>50% e 65%</strong>, conforme relevo, polígono e exigências municipais.</p>
          <p style={{ marginBottom: '6px' }}><strong>Loteamento Aberto (Lei 6.766/1979):</strong> eficiência média de <strong>50% a 58%</strong>. Vias, praças e áreas institucionais são doadas ao município.</p>
          <p style={{ marginBottom: '6px' }}><strong>Condomínio de Lotes (Lei 13.465/2017):</strong> eficiência de <strong>58% a 68%</strong>, com vias internas como área comum privativa.</p>
          <p style={{ marginBottom: '10px' }}><strong>Fatores Modificadores:</strong> lotes amplos elevam a eficiência; APPs severas, declividade acima de 30% e polígonos irregulares reduzem o aproveitamento.</p>
          <div style={{ backgroundColor: '#f1f5f9', borderLeft: '4px solid #1e3a8a', padding: '8px', margin: '12px 0', fontSize: '10px' }}>
            <strong>Parâmetro Adotado Neste Estudo:</strong> {PRESETS_AREAS[input.tipo].label} baseado na {PRESETS_AREAS[input.tipo].lei}, lote médio de {formatDecimal(input.loteMedio)} m².
          </div>
        </div>
        <div style={{ marginTop: '35px', textAlign: 'center', fontSize: '10.5px', color: '#1e293b' }}>
          <div style={{ width: '220px', borderBottom: '2px solid #0f172a', margin: '0 auto 8px auto' }} />
          <p style={{ fontWeight: 900, fontSize: '11.5px', textTransform: 'uppercase', margin: 0 }}>Rennan Seidl Spechotto</p>
          <p style={{ fontWeight: 'bold', color: '#475569', margin: 0 }}>Engenheiro e Especialista em Gerenciamento de Obras</p>
          <p style={{ fontWeight: 'bold', color: '#475569', margin: 0 }}>Spechotto Assessoria & Construção</p>
          <p style={{ fontSize: '9px', color: '#94a3b8', marginTop: '10px' }}>Documento gerado pela plataforma meUrbanismo • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};
