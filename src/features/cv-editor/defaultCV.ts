import type { CVData } from '@/types/cv';

export const defaultCV: CVData = {
  fullName: 'Catarina Dantas',
  jobTitle: 'Engenheira de Software Sênior',
  address: 'São José dos Campos, SP',
  phone: '(12) 98765-4321',
  email: 'catarina.dantas@exemplo.com.br',
  linkedin: 'linkedin.com/in/catarina-dantas',
  linkedinName: '',
  github: 'github.com/catarinadantas',
  githubName: '',
  portfolio: 'catarinadantas.dev',
  portfolioName: '',
  objective:
    'Engenheira de software com experiência em desenvolvimento back-end e web com C#, .NET, Java e Ruby on Rails. Lidero equipes, desenho arquiteturas escaláveis e implanto testes automatizados, com foco em desempenho, qualidade e redução de custos.',
  education: [
    {
      id: '1',
      course: 'Mestrado em Ciência da Computação',
      institution: 'Universidade de Monte Verde',
      startDate: 'Mar 2019',
      endDate: 'Dez 2021',
      topics: 'Aprendizado profundo\nProcessamento de linguagem natural\nSistemas distribuídos\nRedes de computadores',
    },
    {
      id: '2',
      course: 'Bacharelado em Ciência da Computação',
      institution: 'Universidade de Monte Verde',
      startDate: 'Fev 2014',
      endDate: 'Dez 2017',
      topics: 'Algoritmos e estruturas de dados\nBanco de dados\nEngenharia de software\nComputação em nuvem',
    },
  ],
  experience: [
    {
      id: '1',
      role: 'Engenheira de Software Sênior',
      company: 'Macedo Design de Sistemas',
      startDate: 'Jan 2022',
      endDate: '',
      description:
        'Principais resultados:\nLiderei uma equipe de 10 engenheiros na migração para uma nova arquitetura em .NET, aumentando o desempenho do sistema em 40% e reduzindo os custos de servidor em 20%\nImplantei testes automatizados com xUnit e integração contínua, reduzindo em 40% os incidentes causados por bugs nos primeiros seis meses',
    },
    {
      id: '2',
      role: 'Desenvolvedora de Software',
      company: 'Cia. de Tecnologia Pinheiros',
      startDate: 'Set 2018',
      endDate: 'Dez 2021',
      description:
        'Principais resultados:\nMelhorei o desempenho da aplicação em 30% otimizando consultas SQL no PostgreSQL\nEntreguei com uma equipe de 5 desenvolvedores um projeto de 6 meses uma semana antes do prazo e 15% abaixo do orçamento\nCriei testes automatizados em Java e Ruby que reduziram os relatos de bugs em 40%',
    },
  ],
  skills:
    'C#\n.NET\nJava\nSpring Boot\nRuby on Rails\nReact\nTypeScript\nPostgreSQL\nDocker\nTestes automatizados\nIntegração contínua\nArquitetura de software\nScrum',
  languages: 'Português: nativo\nInglês: avançado',
  softSkills: 'Liderança\nComunicação\nTrabalho em equipe\nResolução de problemas',
  interpersonalSkills:
    'Liderança e mentoria: conduzo revisões de código e pair programming, o que reduziu pela metade o tempo de integração de novos desenvolvedores.\nComunicação: traduzo requisitos de negócio em soluções técnicas para designers e gestores de produto.\nAutonomia: criei uma biblioteca de componentes que reduziu em 60% o tempo de desenvolvimento de novas telas.',
  projects: [
    {
      id: '1',
      name: 'Sistema de Gestão Hospitalar',
      description:
        'Sistema web para gestão de pacientes, agendamentos e prontuários. Desenvolvi a arquitetura back-end com Java e Spring Boot e o front-end com React.',
      technologies: 'Java, Spring Boot, React, PostgreSQL',
      link: 'github.com/catarinadantas/gestao-hospitalar',
      startDate: 'Jan 2021',
      endDate: 'Ago 2021',
    },
    {
      id: '2',
      name: 'App de Finanças Pessoais',
      description:
        'Aplicativo para controle de despesas e orçamento pessoal com gráficos de análise. Desenvolvi o painel e os relatórios.',
      technologies: 'React Native, TypeScript, Firebase',
      link: 'github.com/catarinadantas/financas-pessoais',
      startDate: 'Mar 2020',
      endDate: 'Jul 2020',
    },
  ],
};

export const emptyCV: CVData = structuredClone(defaultCV);
