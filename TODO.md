# Issue #54: Backend Global Validation Policy - DTO Whitelisting & Consistent 400s

## Progress Tracker
✅ [DONE] Create branch `blackboxai/issue-54-global-validation-dto-whitelisting`  
⏳ [PENDING] 1. Update backend/src/common/filters/http-exception.filter.ts (custom ValidationError mapping to stable shape)  
⏳ [PENDING] 2. Read & decorate remaining DTOs:  
   - backend/src/dto/policy.dto.ts (interfaces → classes + @Is*)  
   - backend/src/claims/dto/claim.dto.ts  
   - backend/src/auth/dto/challenge.dto.ts  
   - backend/src/notifications/dto/update-preferences.dto.ts  
   - backend/src/tx/dto/build-tx.dto.ts  
   - backend/src/tx/dto/submit-tx.dto.ts  
   - backend/src/support/dto/create-ticket.dto.ts  
   - backend/src/admin/dto/audit-query.dto.ts, feature-flag.dto.ts, reindex.dto.ts  
   - Others as found (e.g. health.dto.ts if request DTO)  
⏳ [PENDING] 3. Create/Update backend/README.md with validation error catalog & security notes  
⏳ [PENDING] 4. Commit changes  
⏳ [PENDING] 5. Push branch  
⏳ [PENDING] 6. Create PR  

**Next:** Read key DTOs for decoration planning, then edit filter first.

