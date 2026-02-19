using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

namespace Maka.CRM.Services;

public class RabbitMqPublisher : IDisposable
{
    private readonly IConnection _connection;
    private readonly IModel _channel;

    public RabbitMqPublisher(IConfiguration configuration)
    {
        var factory = new ConnectionFactory
        {
            HostName = configuration["RabbitMQ:Host"] ?? "rabbitmq",
            UserName = configuration["RabbitMQ:Username"] ?? "maka",
            Password = configuration["RabbitMQ:Password"] ?? "maka_secret",
        };

        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();

        _channel.ExchangeDeclare(exchange: "maka.events", type: ExchangeType.Topic, durable: true);
    }

    public void Publish(string exchange, string routingKey, object message)
    {
        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message));

        var properties = _channel.CreateBasicProperties();
        properties.Persistent = true;
        properties.ContentType = "application/json";

        _channel.BasicPublish(
            exchange: exchange,
            routingKey: routingKey,
            basicProperties: properties,
            body: body
        );
    }

    public void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
    }
}
