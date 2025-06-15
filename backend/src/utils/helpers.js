/**
 * Função para formatar valores monetários
 * @param {number} value - Valor a ser formatado
 * @param {string} currency - Moeda (padrão: BRL)
 */
const formatCurrency = (value, currency = 'BRL') => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(value);
};

/**
 * Função para formatar datas
 * @param {Date|string} date - Data a ser formatada
 * @param {string} format - Formato (padrão: 'dd/MM/yyyy')
 */
const formatDate = (date, format = 'dd/MM/yyyy') => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Data inválida';
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  switch (format) {
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;
    case 'MM/dd/yyyy':
      return `${month}/${day}/${year}`;
    default:
      return `${day}/${month}/${year}`;
  }
};

/**
 * Função para validar se uma data está dentro de um intervalo
 * @param {Date|string} date - Data a ser verificada
 * @param {Date|string} startDate - Data inicial
 * @param {Date|string} endDate - Data final
 */
const isDateInRange = (date, startDate, endDate) => {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);

  return d >= start && d <= end;
};

/**
 * Função para calcular a diferença em dias entre duas datas
 * @param {Date|string} date1 - Primeira data
 * @param {Date|string} date2 - Segunda data
 */
const daysDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Função para obter o primeiro e último dia do mês
 * @param {Date|string} date - Data de referência
 */
const getMonthRange = (date = new Date()) => {
  const d = new Date(date);
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  
  return {
    start: formatDate(firstDay, 'yyyy-MM-dd'),
    end: formatDate(lastDay, 'yyyy-MM-dd')
  };
};

/**
 * Função para obter o primeiro e último dia da semana
 * @param {Date|string} date - Data de referência
 */
const getWeekRange = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira
  
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(d.setDate(diff + 6));
  
  return {
    start: formatDate(monday, 'yyyy-MM-dd'),
    end: formatDate(sunday, 'yyyy-MM-dd')
  };
};

/**
 * Função para sanitizar strings (remover caracteres especiais)
 * @param {string} str - String a ser sanitizada
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>\"'%;()&+]/g, '');
};

/**
 * Função para gerar um hash simples de string
 * @param {string} str - String para gerar hash
 */
const generateHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converter para 32bit integer
  }
  return hash.toString(36);
};

/**
 * Função para calcular porcentagem
 * @param {number} value - Valor atual
 * @param {number} total - Valor total
 */
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100; // 2 casas decimais
};

/**
 * Função para ordenar array de objetos por propriedade
 * @param {Array} array - Array a ser ordenado
 * @param {string} property - Propriedade para ordenação
 * @param {string} order - 'asc' ou 'desc'
 */
const sortByProperty = (array, property, order = 'asc') => {
  return array.sort((a, b) => {
    if (order === 'asc') {
      return a[property] > b[property] ? 1 : -1;
    } else {
      return a[property] < b[property] ? 1 : -1;
    }
  });
};

module.exports = {
  formatCurrency,
  formatDate,
  isDateInRange,
  daysDifference,
  getMonthRange,
  getWeekRange,
  sanitizeString,
  generateHash,
  calculatePercentage,
  sortByProperty
}; 