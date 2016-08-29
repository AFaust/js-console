var requiredServices, services, idx, jdx, serviceFound;

requiredServices = [ 'jsconsole/backend/LegacyRepositoryConsoleBackend', 'alfresco/services/SearchService',
        'alfresco/services/SiteService', 'alfresco/services/DialogService', 'alfresco/services/DocumentService' ];

if (Array.isArray(model.jsonModel.services))
{
    services = model.jsonModel.services;

    for (idx = 0; idx < requiredServices.length; idx++)
    {
        serviceFound = false;

        for (jdx = 0; jdx < services.length; jdx++)
        {
            if (services[jdx] === requiredServices[idx]
                    || (typeof services[jdx].name === 'string' && services[jdx].name === requiredServices[idx])
                    || (typeof requiredServices[idx].name === 'string' && services[jdx] === requiredServices[idx].name)
                    || (typeof requiredServices[idx].name === 'string' && typeof services[jdx].name === 'string' && services[jdx].name === requiredServices[idx].name))
            {
                serviceFound = true;
                break;
            }
        }

        if (!serviceFound)
        {
            services.push(requiredServices[idx]);
        }
        else if (typeof requiredServices[idx] === 'object')
        {
            // TODO potentially merge service configs
        }
    }
}