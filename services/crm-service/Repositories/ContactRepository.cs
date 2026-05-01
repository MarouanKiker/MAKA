using Microsoft.EntityFrameworkCore;
using CrmService.Data;
using CrmService.Interfaces;
using CrmService.Models;

namespace CrmService.Repositories;

public class ContactRepository : IContactRepository
{
    private readonly CrmDbContext _context;

    public ContactRepository(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<List<Contact>> GetAllAsync(int? compteId, string? search)
    {
        IQueryable<Contact> query = _context.Contacts.Include(c => c.Compte);

        if (compteId.HasValue)
            query = query.Where(c => c.CompteId == compteId.Value);

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            query = query.Where(c =>
                c.Nom.ToLower().Contains(s) ||
                c.Prenom.ToLower().Contains(s) ||
                (c.Email != null && c.Email.ToLower().Contains(s)));
        }

        return await query.OrderBy(c => c.Nom).ToListAsync();
    }

    public async Task<Contact?> GetByIdAsync(int id)
    {
        return await _context.Contacts
            .Include(c => c.Compte)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Contact> CreateAsync(Contact contact)
    {
        _context.Contacts.Add(contact);
        await _context.SaveChangesAsync();
        return contact;
    }

    public async Task<Contact> UpdateAsync(Contact contact)
    {
        _context.Contacts.Update(contact);
        await _context.SaveChangesAsync();
        return contact;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var contact = await _context.Contacts.FindAsync(id);
        if (contact == null) return false;

        _context.Contacts.Remove(contact);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Contacts.AnyAsync(c => c.Id == id);
    }
}
