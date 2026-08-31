import React from 'react';
import {
  Building2,
  ShieldCheck,
  Award,
  Compass,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Layers,
  TrendingUp,
  BarChart3,
  HardHat,
  Cpu
} from 'lucide-react';

export const PortfolioTab: React.FC = () => {
  const servicos = [
    {
      titulo: 'Estudos de Viabilidade Urbanística',
      desc: 'Análise de aproveitamento de glebas, projeção de VGV, estimativa de custos de infraestrutura e modelagem temporal (TIR, VPL e Payback).',
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      titulo: 'Projetos Urbanísticos & Infraestrutura',
      desc: 'Concepção de loteamentos e condomínios fechados, terraplanagem, drenagem pluvial, pavimentação asfáltica, redes de água e esgoto.',
      icon: Compass,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      titulo: 'Gestão, Fiscalização & Medições',
      desc: 'Acompanhamento diário in loco, controle tecnológico de materiais, boletins de medição com empreiteiras e relatórios executivos para investidores.',
      icon: HardHat,
      color: 'text-amber-600 bg-amber-50'
    },
    {
      titulo: 'Orçamentação Paramétrica & SINAPI',
      desc: 'Levantamento de quantitativos com curva ABC, matrizes de insumos, cronogramas físico-financeiros e controle orçamentário rigoroso.',
      icon: BarChart3,
      color: 'text-emerald-600 bg-emerald-50'
    }
  ];

  const cases = [
    {
      nome: 'Residencial Reserva dos Ipês',
      tipo: 'Loteamento Fechado de Alto Padrão',
      local: 'Mirassol - SP',
      area: '245.000 m²',
      lotes: '312 lotes',
      vgv: 'R$ 38,5 Milhões',
      img: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800'
    },
    {
      nome: 'Villa Bella Urban Park',
      tipo: 'Loteamento Aberto Integrado',
      local: 'São José do Rio Preto - SP',
      area: '180.000 m²',
      lotes: '240 lotes',
      vgv: 'R$ 29,8 Milhões',
      img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800'
    },
    {
      nome: 'Condomínio Quinta dos Lagos',
      tipo: 'Condomínio Náutico & Lazer',
      local: 'Fronteira - MG',
      area: '320.000 m²',
      lotes: '410 lotes',
      vgv: 'R$ 52,0 Milhões',
      img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-fadeIn">
      
      {/* BANNER INSTITUCIONAL PRINCIPAL */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 p-8 sm:p-12 text-white shadow-xl">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Spechotto Assessoria & Construção
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Engenharia de Excelência para Loteamentos & Condomínios
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Especialistas em desenvolvimento urbano, viabilidade econômico-financeira, engenharia de infraestrutura e fiscalização de ponta a ponta.
          </p>
        </div>
      </div>

      {/* DIFERENCIAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="text-3xl font-black text-blue-900">+1.5M m²</div>
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Glebas Desenvolvidas</p>
          <p className="text-[11px] text-slate-500">Mais de 15 empreendimentos planejados e executados com sucesso.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="text-3xl font-black text-emerald-600">+R$ 200M</div>
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">VGV Gerenciado</p>
          <p className="text-[11px] text-slate-500">Gestão financeira orientada à rentabilidade e eficiência construtiva.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="text-3xl font-black text-purple-600">100% Digital</div>
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Plataforma meUrbanismo</p>
          <p className="text-[11px] text-slate-500">Transparência em tempo real para investidores, corretores e clientes.</p>
        </div>
      </div>

      {/* SERVIÇOS ESPECIALIZADOS */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Serviços Especializados</h2>
          <p className="text-xs text-slate-500">Soluções integradas de engenharia e gestão para loteadoras e investidores</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servicos.map((s, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">{s.titulo}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CASES DE SUCESSO */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Empreendimentos em Destaque</h2>
          <p className="text-xs text-slate-500">Alguns dos projetos estruturados e fiscalizados pela Spechotto</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cases.map((c, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden group">
              <div className="h-44 overflow-hidden relative">
                <img src={c.img} alt={c.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase">
                  {c.tipo}
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-extrabold text-slate-900 text-sm">{c.nome}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> {c.local}
                </p>
                <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-center text-[10px]">
                  <div>
                    <span className="text-slate-400 block">Área</span>
                    <strong className="text-slate-800">{c.area}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Lotes</span>
                    <strong className="text-slate-800">{c.lotes}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">VGV</span>
                    <strong className="text-emerald-600">{c.vgv}</strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONTATO & RESPONSÁVEL TÉCNICO */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-base font-black text-slate-900">
            Spechotto Assessoria & Construção
          </h2>
          <p className="text-xs text-slate-500 max-w-md">
            <strong>Responsável Técnico:</strong> Eng. Rennan Seidl Spechotto (CREA-SP 5069248190)
            <br />
            Consultoria e assessoria especializada em novos loteamentos e viabilidades.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <a
            href="mailto:rennan.spechotto@gmail.com"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4" /> rennan.spechotto@gmail.com
          </a>
        </div>
      </div>

    </div>
  );
};
