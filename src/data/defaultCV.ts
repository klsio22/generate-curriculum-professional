import type { CVData } from '../types';

export const defaultCV: CVData = {
  fullName: 'Catarina Dantas',
  jobTitle: 'DESENVOLVEDORA DE SOFTWARE',
  address: '',
  phone: '(12) 456-7890',
  email: 'ola@grandesite.com.br',
  linkedin: 'www.linkedin.com/in/usuario',
  linkedinName: 'usuario-linkedin',
  github: 'github.com/usuario',
  githubName: 'usuario',
  portfolio: 'www.grandesite.com.br',
  portfolioName: 'meu-portfolio',
  objective:
    'Desenvolvedora de software e arquiteta de sistemas com experiência em projetar, programar e testar sistemas complexos. Minha expertise está nas linguagens de programação C#, Java e Ruby.',
  education: [
    {
      id: '1',
      course: 'Mestrado em Ciência da Computação',
      institution: 'Universidade de Monte Verde',
      startDate: 'Maio de 2030',
      endDate: 'Maio de 2032',
      topics:
        'Deep Learning\nNatural Language Processing\nAdvanced Operating Systems\nDistributed Computing\nComputer Networks',
    },
    {
      id: '2',
      course: 'Ciência da Computação',
      institution: 'Universidade de Monte Verde',
      startDate: 'Jun 2026',
      endDate: 'Jun 2030',
      topics:
        'Applied Mathematics\nDiscrete Mathematics\nAlgorithms\nDatabases\nMachine Learning\nArtificial Intelligence\nNatural Language Processing\nCloud Computing\nDistributed Computing',
    },
  ],
  experience: [
    {
      id: '1',
      role: 'Engenheira de Software Sênior',
      company: 'Macedo Design de Sistemas',
      startDate: 'Jan 2034',
      endDate: 'Jun 2038',
      description:
        'Liderou uma equipe de 10 engenheiros no desenvolvimento de uma nova arquitetura que aumentou o desempenho do sistema em 40% e reduziu os custos do servidor em 20%\nImplementou com sucesso protocolos de testes automatizados, reduzindo incidentes relacionados a bugs em 40% nos primeiros seis meses',
    },
    {
      id: '2',
      role: 'Desenvolvedora de Software',
      company: 'Cia. de Tecnologia Pinheiros',
      startDate: 'Set 2030',
      endDate: 'Dez 2033',
      description:
        'Melhorou o desempenho do app em 30% por meio da otimização de consultas ao banco de dados\nColaborou com sucesso com uma equipe de 5 desenvolvedores para concluir um grande projeto, entregando o produto final 1 semana antes do prazo de 6 meses e 15% abaixo do orçamento\nImplementou procedimentos de testes automatizados que reduziram os relatórios de bugs em 40%, aumentando a confiabilidade geral do software e a satisfação do cliente',
    },
  ],
  skills:
    'Análise de Sistemas\nPesquisa de Usuários\nMachine Learning\nMetodologia Ágil\nBanco de Dados',
  languages: 'Inglês: B1 (Intermediário avançado) - Leitura técnica fluente, participação em code reviews internacionais',
  softSkills: '',
  interpersonalSkills: `Liderança e Mentoria: Conduzo revisões de código detalhadas e sessões de pair programming, reduzindo tempo de onboarding de novos desenvolvedores em 50%. Assumo naturalmente papel de referência técnica, propondo soluções para problemas complexos e educando a equipe sobre trade-offs técnicos.
  Comunicação e Colaboração: Facilito comunicação efetiva entre equipes técnicas e não-técnicas, traduzindo requisitos de negócio em soluções técnicas viáveis. Demonstro empatia ao entender perspectivas de designers, PMs e stakeholders, criando consenso através de apresentações claras e negociação construtiva.
  Resolução de Problemas: Aplico pensamento analítico sistemático para diagnosticar problemas complexos, como evidenciado pela resolução de bug crítico de race condition que salvou dados de clientes e pela otimização de performance que aumentou conversões em 25%.
  Autonomia e Proatividade: Identifico oportunidades de melhoria sem ser solicitado, como criação de biblioteca de componentes que reduziu tempo de desenvolvimento em 60% e documentação técnica que diminuiu code reviews em 50%.
  Resiliência e Aprendizado: Enfrento desafios técnicos complexos com persistência, dedicando tempo para dominar código legado difícil e transformá-lo em solução moderna e manutenível, enquanto documento o processo para benefício da equipe.
  Gestão de Tempo e Organização: Entrego projetos consistentemente no prazo através de planejamento cuidadoso, priorização efetiva e comunicação proativa sobre riscos e impedimentos.`,

  
  projects: [
    {
      id: '1',
      name: 'Sistema de Gestão Hospitalar',
      description:
        'Desenvolvimento de sistema web completo para gestão de pacientes, agendamentos e registros médicos. Implementei a arquitetura backend com Java Spring Boot e frontend com React.',
      technologies: 'Java, Spring Boot, React, PostgreSQL',
      link: 'github.com/usuario/hospital-system',
      startDate: 'Jan 2032',
      endDate: 'Ago 2032',
    },
    {
      id: '2',
      name: 'App Mobile de Finanças Pessoais',
      description:
        'Aplicativo mobile para controle de despesas e orçamento pessoal com gráficos de análise. Participei como desenvolvedora principal na implementação das funcionalidades de dashboard e relatórios.',
      technologies: 'React Native, Firebase, Expo',
      link: 'github.com/usuario/finance-app',
      startDate: 'Mar 2031',
      endDate: 'Jul 2031',
    },
  ],
};

export const emptyCV: CVData = structuredClone(defaultCV);
