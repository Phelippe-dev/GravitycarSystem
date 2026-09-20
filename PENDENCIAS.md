# Pendências para a Próxima Sessão

1. **Correção de Isolamento de Tenants (Urgente)**
   - O sistema está permitindo que os tenants puxem dados de outras concessionárias cadastradas.
   - Revisar o `FakeCurrentTenantService`, `AppDbContext` (filtros globais `HasQueryFilter`), ou a injeção de `EmpresaId` no banco/consultas para garantir o isolamento completo dos dados por tenant.
