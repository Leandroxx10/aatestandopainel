Correção V5 - Filtro por turnos no histórico

Problema corrigido:
- O filtro dos turnos usava comparação por data/hora separadas.
- O Turno 3 estava sendo tratado como 22:00 do dia selecionado até 06:00 do dia seguinte.
- Na operação real, quando o usuário seleciona 03/05 de madrugada, o Turno 3 correto é 02/05 22:00 até 03/05 06:00.
- Isso fazia os lançamentos de madrugada não aparecerem no filtro do turno.

Alterações:
- Filtro dos turnos agora usa janela absoluta em timestamp.
- Turno 1: data selecionada 06:00 até 14:00.
- Turno 2: data selecionada 14:00 até 22:00.
- Turno 3: dia anterior 22:00 até data selecionada 06:00.
- Manutenções usam a mesma regra de janela dos gráficos.
- Ordenação do gráfico agora usa timestamp real, evitando erro de virada de dia.
