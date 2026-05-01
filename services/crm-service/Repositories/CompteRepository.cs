using Microsoft.EntityFrameworkCore;
using CrmService.Data;
using CrmService.Interfaces;
using CrmService.Models;

namespace CrmService.Repositories;

public class CompteRepository : ICompteRepository
{
    private readonly CrmDbContext _context;

    public CompteRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<Compte> Items, int TotalCount)> GetPaginatedAsync(string? search, int page, int size)
    {
        var query = _context.Comptes.Include(c => c.Contacts).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(c => c.Nom.Contains(search) || c.Email.Contains(search));
        }

        int total = await query.CountAsync();
        var items = await query.Skip((page - 1) * size).Take(size).ToListAsync();

        return (items, total);
    }

    public async Task<Compte?> GetByIdAsync(int id)
    {
        return await _context.Comptes.Include(c => c.Contacts).FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Compte> AddAsync(Compte compte)
    {
        _context.Comptes.Add(compte);
        await _context.SaveChangesAsync();
        return compte;
    }

    public async Task<Compte> CreateAsync(Compte compte)
    {
        _context.Comptes.Add(compte);
        await _context.SaveChangesAsync();
        return compte;
    }

    public async Task<Compte> UpdateAsync(Compte compte)
    {
        _context.Comptes.Update(compte);
        await _context.SaveChangesAsync();
        return compte;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var compte = await _context.Comptes.FindAsync(id);
        if (compte == null) return false;

        _context.Comptes.Remove(compte);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Comptes.AnyAsync(e => e.Id == id);
    }
    
    public async Task<int> CountAsync(string? search)
    {
        var query = _context.Comptes.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(c => c.Nom.Contains(search) || c.Email.Contains(search));
        }
        return await query.CountAsync();
    }
    
    public async Task<List<Compte>> GetAllAsync(string? search, int page, int pageSize)
    {
        var query = _context.Comptes.Include(c => c.Contacts).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(c => c.Nom.Contains(search) || c.Email.Contains(search));
        }

        return await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
    }
}