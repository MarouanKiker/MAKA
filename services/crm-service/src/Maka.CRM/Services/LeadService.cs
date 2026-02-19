using Maka.CRM.Data;
using Maka.CRM.DTOs;
using Maka.CRM.Models;
using Microsoft.EntityFrameworkCore;

namespace Maka.CRM.Services;

public class LeadService : ILeadService
{
    private readonly CrmDbContext _context;
    private readonly RabbitMqPublisher _publisher;

    public LeadService(CrmDbContext context, RabbitMqPublisher publisher)
    {
        _context = context;
        _publisher = publisher;
    }

    public async Task<IEnumerable<LeadResponseDto>> GetAllAsync()
    {
        return await _context.Leads
            .Select(l => MapToDto(l))
            .ToListAsync();
    }

    public async Task<LeadResponseDto?> GetByIdAsync(int id)
    {
        var lead = await _context.Leads.FindAsync(id);
        return lead is null ? null : MapToDto(lead);
    }

    public async Task<LeadResponseDto> CreateAsync(CreateLeadDto dto)
    {
        var lead = new Lead
        {
            Nom = dto.Nom,
            Source = dto.Source,
            Score = dto.Score,
            UtilisateurId = dto.UtilisateurId,
            CampagneId = dto.CampagneId,
        };

        _context.Leads.Add(lead);
        await _context.SaveChangesAsync();

        return MapToDto(lead);
    }

    public async Task<LeadResponseDto?> UpdateAsync(int id, UpdateLeadDto dto)
    {
        var lead = await _context.Leads.FindAsync(id);
        if (lead is null) return null;

        if (dto.Nom is not null) lead.Nom = dto.Nom;
        if (dto.Source is not null) lead.Source = dto.Source;
        if (dto.Score.HasValue) lead.Score = dto.Score.Value;
        if (dto.UtilisateurId.HasValue) lead.UtilisateurId = dto.UtilisateurId.Value;

        await _context.SaveChangesAsync();
        return MapToDto(lead);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var lead = await _context.Leads.FindAsync(id);
        if (lead is null) return false;

        _context.Leads.Remove(lead);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<LeadResponseDto?> QualifyAsync(int id)
    {
        var lead = await _context.Leads.FindAsync(id);
        if (lead is null) return null;

        lead.Statut = StatutLead.Qualifie;
        await _context.SaveChangesAsync();
        return MapToDto(lead);
    }

    public async Task<LeadResponseDto?> ConvertToOpportunityAsync(int id)
    {
        var lead = await _context.Leads.FindAsync(id);
        if (lead is null) return null;

        lead.Statut = StatutLead.Converti;

        var opportunite = new Opportunite
        {
            Titre = $"Opportunité — {lead.Nom}",
            LeadId = lead.Id,
            Statut = StatutOpportunite.Prospect,
        };

        _context.Opportunites.Add(opportunite);
        await _context.SaveChangesAsync();

        _publisher.Publish("maka.events", "crm.lead.converti", new { LeadId = id, OpportuniteId = opportunite.Id });

        return MapToDto(lead);
    }

    private static LeadResponseDto MapToDto(Lead l) => new()
    {
        Id = l.Id,
        Nom = l.Nom,
        Source = l.Source,
        Statut = l.Statut.ToString(),
        Score = l.Score,
        DateCreation = l.DateCreation,
        CampagneId = l.CampagneId,
    };
}
