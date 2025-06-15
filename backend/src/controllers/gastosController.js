const gastosService = require('../services/gastosService');

class GastosController {
  
  // GET /api/gastos
  async listarGastos(req, res) {
    try {
      const filtros = {
        categoria_id: req.query.categoria_id,
        data_inicio: req.query.data_inicio,
        data_fim: req.query.data_fim,
        mes: req.query.mes ? parseInt(req.query.mes) : null,
        ano: req.query.ano ? parseInt(req.query.ano) : null
      };

      // Remove filtros vazios
      Object.keys(filtros).forEach(key => {
        if (filtros[key] === undefined || filtros[key] === null) {
          delete filtros[key];
        }
      });

      const gastos = await gastosService.listarGastos(filtros);
      
      res.json({
        success: true,
        data: gastos,
        total: gastos.length,
        filtros: filtros
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /api/gastos/:id
  async buscarGasto(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID do gasto é obrigatório'
        });
      }

      const gasto = await gastosService.buscarGastoPorId(id);
      
      if (!gasto) {
        return res.status(404).json({
          success: false,
          error: 'Gasto não encontrado'
        });
      }

      res.json({
        success: true,
        data: gasto
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /api/gastos
  async criarGasto(req, res) {
    try {
      const { valor, descricao, categoria_id, data } = req.body;

      // Validações básicas
      if (!valor || !categoria_id || !data) {
        return res.status(400).json({
          success: false,
          error: 'Valor, categoria e data são obrigatórios'
        });
      }

      if (isNaN(parseFloat(valor)) || parseFloat(valor) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valor deve ser um número positivo'
        });
      }

      // Validar formato da data (YYYY-MM-DD)
      const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dataRegex.test(data)) {
        return res.status(400).json({
          success: false,
          error: 'Data deve estar no formato YYYY-MM-DD'
        });
      }

      const dadosGasto = {
        valor: parseFloat(valor),
        descricao: descricao || '',
        categoria_id: parseInt(categoria_id),
        data,
        criado_em: new Date().toISOString()
      };

      const novoGasto = await gastosService.criarGasto(dadosGasto);

      res.status(201).json({
        success: true,
        data: novoGasto,
        message: 'Gasto criado com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // PUT /api/gastos/:id
  async atualizarGasto(req, res) {
    try {
      const { id } = req.params;
      const { valor, descricao, categoria_id, data } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID do gasto é obrigatório'
        });
      }

      // Validações se os campos foram fornecidos
      const dadosAtualizacao = {};

      if (valor !== undefined) {
        if (isNaN(parseFloat(valor)) || parseFloat(valor) <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Valor deve ser um número positivo'
          });
        }
        dadosAtualizacao.valor = parseFloat(valor);
      }

      if (descricao !== undefined) {
        dadosAtualizacao.descricao = descricao;
      }

      if (categoria_id !== undefined) {
        dadosAtualizacao.categoria_id = parseInt(categoria_id);
      }

      if (data !== undefined) {
        const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dataRegex.test(data)) {
          return res.status(400).json({
            success: false,
            error: 'Data deve estar no formato YYYY-MM-DD'
          });
        }
        dadosAtualizacao.data = data;
      }

      dadosAtualizacao.atualizado_em = new Date().toISOString();

      const gastoAtualizado = await gastosService.atualizarGasto(id, dadosAtualizacao);

      res.json({
        success: true,
        data: gastoAtualizado,
        message: 'Gasto atualizado com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // DELETE /api/gastos/:id
  async deletarGasto(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID do gasto é obrigatório'
        });
      }

      await gastosService.deletarGasto(id);

      res.json({
        success: true,
        message: 'Gasto deletado com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /api/gastos/estatisticas
  async obterEstatisticas(req, res) {
    try {
      const filtros = {
        mes: req.query.mes ? parseInt(req.query.mes) : null,
        ano: req.query.ano ? parseInt(req.query.ano) : null
      };

      // Remove filtros vazios
      Object.keys(filtros).forEach(key => {
        if (filtros[key] === null) {
          delete filtros[key];
        }
      });

      const estatisticas = await gastosService.obterEstatisticas(filtros);

      res.json({
        success: true,
        data: estatisticas,
        periodo: filtros
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new GastosController(); 