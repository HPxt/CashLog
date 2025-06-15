const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Listar todas as metas
 */
const getAllMetas = async () => {
  const { data, error } = await supabase
    .from('metas')
    .select(`
      *,
      categoria:categorias(id, nome, cor, icone)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar metas:', error);
    throw new Error('Erro ao buscar metas');
  }

  return data || [];
};

/**
 * Buscar meta por ID
 */
const getMetaById = async (id) => {
  const { data, error } = await supabase
    .from('metas')
    .select(`
      *,
      categoria:categorias(id, nome, cor, icone)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Meta não encontrada
    }
    console.error('Erro ao buscar meta:', error);
    throw new Error('Erro ao buscar meta');
  }

  return data;
};

/**
 * Criar nova meta
 */
const createMeta = async (dadosMeta) => {
  const { data, error } = await supabase
    .from('metas')
    .insert([dadosMeta])
    .select(`
      *,
      categoria:categorias(id, nome, cor, icone)
    `)
    .single();

  if (error) {
    console.error('Erro ao criar meta:', error);
    throw new Error('Erro ao criar meta');
  }

  return data;
};

/**
 * Atualizar meta
 */
const updateMeta = async (id, dadosAtualizacao) => {
  const { data, error } = await supabase
    .from('metas')
    .update(dadosAtualizacao)
    .eq('id', id)
    .select(`
      *,
      categoria:categorias(id, nome, cor, icone)
    `)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Meta não encontrada
    }
    console.error('Erro ao atualizar meta:', error);
    throw new Error('Erro ao atualizar meta');
  }

  return data;
};

/**
 * Deletar meta
 */
const deleteMeta = async (id) => {
  const { error } = await supabase
    .from('metas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar meta:', error);
    throw new Error('Erro ao deletar meta');
  }

  return true;
};

/**
 * Obter progresso das metas
 */
const getProgressoMetas = async (filtros = {}) => {
  try {
    let query = supabase
      .from('metas')
      .select(`
        *,
        categoria:categorias(id, nome, cor, icone)
      `)
      .eq('ativa', true);

    // Aplicar filtros se fornecidos
    if (filtros.categoria_id) {
      query = query.eq('categoria_id', filtros.categoria_id);
    }

    const { data: metas, error: metasError } = await query;

    if (metasError) {
      throw metasError;
    }

    // Para cada meta, calcular o progresso
    const metasComProgresso = await Promise.all(
      metas.map(async (meta) => {
        // Buscar gastos relacionados à meta
        let gastosQuery = supabase
          .from('gastos')
          .select('valor, data');

        // Filtrar por categoria se a meta tiver categoria específica
        if (meta.categoria_id) {
          gastosQuery = gastosQuery.eq('categoria_id', meta.categoria_id);
        }

        // Filtrar por período se especificado
        if (filtros.mes && filtros.ano) {
          const inicioMes = `${filtros.ano}-${String(filtros.mes).padStart(2, '0')}-01`;
          const fimMes = new Date(filtros.ano, filtros.mes, 0).toISOString().split('T')[0];
          gastosQuery = gastosQuery.gte('data', inicioMes).lte('data', fimMes);
        } else if (filtros.ano) {
          gastosQuery = gastosQuery.gte('data', `${filtros.ano}-01-01`).lte('data', `${filtros.ano}-12-31`);
        }

        const { data: gastos, error: gastosError } = await gastosQuery;

        if (gastosError) {
          console.error('Erro ao buscar gastos para progresso:', gastosError);
        }

        const totalGasto = gastos ? gastos.reduce((total, gasto) => total + parseFloat(gasto.valor), 0) : 0;
        const porcentagem = meta.valor_objetivo > 0 ? (totalGasto / meta.valor_objetivo) * 100 : 0;

        return {
          ...meta,
          progresso: {
            valor_gasto: totalGasto,
            valor_objetivo: meta.valor_objetivo,
            porcentagem: Math.min(100, Math.round(porcentagem * 100) / 100),
            restante: Math.max(0, meta.valor_objetivo - totalGasto),
            atingida: totalGasto >= meta.valor_objetivo
          }
        };
      })
    );

    return metasComProgresso;
  } catch (error) {
    console.error('Erro ao calcular progresso das metas:', error);
    throw new Error('Erro ao calcular progresso das metas');
  }
};

/**
 * Ativar/Desativar meta
 */
const toggleMetaStatus = async (id) => {
  // Primeiro, buscar o status atual
  const { data: metaAtual, error: buscarError } = await supabase
    .from('metas')
    .select('ativa')
    .eq('id', id)
    .single();

  if (buscarError) {
    if (buscarError.code === 'PGRST116') {
      return null; // Meta não encontrada
    }
    throw new Error('Erro ao buscar meta');
  }

  // Inverter o status
  const novoStatus = !metaAtual.ativa;

  const { data, error } = await supabase
    .from('metas')
    .update({ ativa: novoStatus })
    .eq('id', id)
    .select(`
      *,
      categoria:categorias(id, nome, cor, icone)
    `)
    .single();

  if (error) {
    console.error('Erro ao alterar status da meta:', error);
    throw new Error('Erro ao alterar status da meta');
  }

  return data;
};

module.exports = {
  getAllMetas,
  getMetaById,
  createMeta,
  updateMeta,
  deleteMeta,
  getProgressoMetas,
  toggleMetaStatus
}; 