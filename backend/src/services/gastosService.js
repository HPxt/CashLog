const { supabase } = require('../config/supabase');

class GastosService {
  
  // Listar todos os gastos com filtros opcionais
  async listarGastos(filtros = {}) {
    try {
      let query = supabase
        .from('gastos')
        .select(`
          *,
          categorias:categoria_id(nome, cor)
        `)
        .order('data', { ascending: false });

      // Filtro por categoria
      if (filtros.categoria_id) {
        query = query.eq('categoria_id', filtros.categoria_id);
      }

      // Filtro por período
      if (filtros.data_inicio) {
        query = query.gte('data', filtros.data_inicio);
      }
      
      if (filtros.data_fim) {
        query = query.lte('data', filtros.data_fim);
      }

      // Filtro por mês/ano
      if (filtros.mes && filtros.ano) {
        const dataInicio = `${filtros.ano}-${filtros.mes.toString().padStart(2, '0')}-01`;
        const dataFim = `${filtros.ano}-${filtros.mes.toString().padStart(2, '0')}-31`;
        query = query.gte('data', dataInicio).lte('data', dataFim);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar gastos: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Erro no serviço de gastos: ${error.message}`);
    }
  }

  // Buscar gasto por ID
  async buscarGastoPorId(id) {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .select(`
          *,
          categorias:categoria_id(nome, cor)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Erro ao buscar gasto: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Erro no serviço de gastos: ${error.message}`);
    }
  }

  // Criar novo gasto
  async criarGasto(dadosGasto) {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .insert([dadosGasto])
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar gasto: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Erro no serviço de gastos: ${error.message}`);
    }
  }

  // Atualizar gasto
  async atualizarGasto(id, dadosGasto) {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .update(dadosGasto)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar gasto: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Erro no serviço de gastos: ${error.message}`);
    }
  }

  // Deletar gasto
  async deletarGasto(id) {
    try {
      const { error } = await supabase
        .from('gastos')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao deletar gasto: ${error.message}`);
      }

      return { success: true, message: 'Gasto deletado com sucesso' };
    } catch (error) {
      throw new Error(`Erro no serviço de gastos: ${error.message}`);
    }
  }

  // Obter estatísticas dos gastos
  async obterEstatisticas(filtros = {}) {
    try {
      let query = supabase
        .from('gastos')
        .select('valor, categoria_id, categorias:categoria_id(nome)');

      // Aplicar filtros de data se fornecidos
      if (filtros.mes && filtros.ano) {
        const dataInicio = `${filtros.ano}-${filtros.mes.toString().padStart(2, '0')}-01`;
        const dataFim = `${filtros.ano}-${filtros.mes.toString().padStart(2, '0')}-31`;
        query = query.gte('data', dataInicio).lte('data', dataFim);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
      }

      // Calcular estatísticas
      const totalGasto = data.reduce((total, gasto) => total + parseFloat(gasto.valor), 0);
      
      const gastosPorCategoria = data.reduce((acc, gasto) => {
        const categoria = gasto.categorias?.nome || 'Sem categoria';
        acc[categoria] = (acc[categoria] || 0) + parseFloat(gasto.valor);
        return acc;
      }, {});

      return {
        totalGasto,
        quantidadeGastos: data.length,
        gastosPorCategoria,
        mediaGasto: data.length > 0 ? totalGasto / data.length : 0
      };
    } catch (error) {
      throw new Error(`Erro no serviço de estatísticas: ${error.message}`);
    }
  }
}

module.exports = new GastosService(); 