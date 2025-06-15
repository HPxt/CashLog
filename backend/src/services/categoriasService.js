const { supabase } = require('../config/supabase');

class CategoriasService {
  
  // Listar todas as categorias
  async listarCategorias() {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        throw new Error(`Erro ao buscar categorias: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Erro no serviço de categorias: ${error.message}`);
    }
  }

  // Buscar categoria por ID
  async buscarCategoriaPorId(id) {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Erro ao buscar categoria: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Erro no serviço de categorias: ${error.message}`);
    }
  }

  // Criar nova categoria
  async criarCategoria(dadosCategoria) {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .insert([dadosCategoria])
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar categoria: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Erro no serviço de categorias: ${error.message}`);
    }
  }

  // Atualizar categoria
  async atualizarCategoria(id, dadosCategoria) {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .update(dadosCategoria)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar categoria: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Erro no serviço de categorias: ${error.message}`);
    }
  }

  // Deletar categoria (só se não houver gastos vinculados)
  async deletarCategoria(id) {
    try {
      // Verificar se há gastos vinculados a esta categoria
      const { data: gastosVinculados, error: errorGastos } = await supabase
        .from('gastos')
        .select('id')
        .eq('categoria_id', id)
        .limit(1);

      if (errorGastos) {
        throw new Error(`Erro ao verificar gastos vinculados: ${errorGastos.message}`);
      }

      if (gastosVinculados && gastosVinculados.length > 0) {
        throw new Error('Não é possível deletar categoria que possui gastos vinculados');
      }

      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao deletar categoria: ${error.message}`);
      }

      return { success: true, message: 'Categoria deletada com sucesso' };
    } catch (error) {
      throw new Error(`Erro no serviço de categorias: ${error.message}`);
    }
  }

  // Criar categorias padrão
  async criarCategoriasPadrao() {
    try {
      const categoriasPadrao = [
        { nome: 'Alimentação', cor: '#FF6B6B', icone: '🍔' },
        { nome: 'Transporte', cor: '#4ECDC4', icone: '🚗' },
        { nome: 'Moradia', cor: '#45B7D1', icone: '🏠' },
        { nome: 'Saúde', cor: '#96CEB4', icone: '⚕️' },
        { nome: 'Educação', cor: '#FFEAA7', icone: '📚' },
        { nome: 'Lazer', cor: '#DDA0DD', icone: '🎮' },
        { nome: 'Roupas', cor: '#FFB6C1', icone: '👕' },
        { nome: 'Outros', cor: '#D3D3D3', icone: '📦' }
      ];

      const { data, error } = await supabase
        .from('categorias')
        .insert(categoriasPadrao)
        .select();

      if (error) {
        throw new Error(`Erro ao criar categorias padrão: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Erro no serviço de categorias: ${error.message}`);
    }
  }
}

module.exports = new CategoriasService(); 