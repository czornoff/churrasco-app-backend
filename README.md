# Backend

Este é o diretório do backend do seu projeto.

## Instruções de instalação

1. Certifique-se de ter Node.js instalado em sua máquina.
2. Clone este repositório para o seu ambiente local.
3. Navegue até o diretório do projeto.
4. Instale as dependências do projeto executando o seguinte comando: `npm install`
5. Configure as variáveis de ambiente, como a URL do banco de dados e a chave de API, no arquivo `.env` verifique o arquivo `.env-example`.
6. Inicie o servidor executando o seguinte comando: `npm start`

## Rotas

Aqui estão as rotas do backend:

- GET /api/opcaos: Busca todas as opções e configurações do banco de dados.
- GET /api/conteudo: Busca os conteúdos do banco de dados.
- GET /api/usuario: Busca todos usuários no banco de dados.
- POST /api/calcular: Cálculo a quantidade de itens do churrasco.
- POST /admin/opcao/salvar: Salva as opções e configurações no banco de dados.
- POST /admin/conteudo/salvar: Salva os conteúdos no banco de dados.
- POST /admin/usuario/salvar: Salva um novo usuário no banco de dados.
- PUT /admin/usuario/salvar/:id: Atualiza um usuário existente no banco de dados.
- DELETE /admin/usuario/excluir/:id: Exclui um usuário do banco de dados.
- GET /admin/relatorio: Busca todos os dados de relatório no banco de dados.

## Contribuição

Contribuições são bem-vindas! Se você quiser contribuir para este projeto, siga estas etapas:

1. Faça um fork deste repositório.
2. Crie uma branch para sua contribuição: `git checkout -b minha-contribuicao`
3. Faça suas alterações e faça commit: `git commit -am "Minha contribuição"`
4. Faça push para a branch: `git push origin minha-contribuicao`
5. Abra um pull request neste repositório.

## Licença

Este projeto está licenciado sob a Licença MIT. Consulte o arquivo `LICENSE` para obter mais informações.