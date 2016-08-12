package de.fme.jsconsole;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicInteger;

import org.alfresco.processor.ProcessorExtension;
import org.alfresco.repo.jscript.BaseScopableProcessorExtension;
import org.alfresco.repo.jscript.NativeMap;
import org.alfresco.repo.jscript.Scopeable;
import org.alfresco.repo.jscript.ScriptNode;
import org.alfresco.repo.jscript.ScriptableHashMap;
import org.alfresco.repo.processor.BaseProcessor;
import org.alfresco.repo.processor.BaseProcessorExtension;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.workflow.WorkflowModel;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.dictionary.AspectDefinition;
import org.alfresco.service.cmr.dictionary.ClassDefinition;
import org.alfresco.service.cmr.dictionary.DictionaryService;
import org.alfresco.service.cmr.dictionary.PropertyDefinition;
import org.alfresco.service.cmr.dictionary.TypeDefinition;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.ScriptService;
import org.alfresco.service.cmr.security.PersonService;
import org.alfresco.service.namespace.NamespaceService;
import org.alfresco.service.namespace.QName;
import org.alfresco.util.Pair;
import org.alfresco.util.PropertyCheck;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.ApplicationContextAware;
import org.springframework.core.LocalVariableTableParameterNameDiscoverer;
import org.springframework.core.ParameterNameDiscoverer;
import org.springframework.extensions.surf.util.I18NUtil;
import org.springframework.extensions.webscripts.Cache;
import org.springframework.extensions.webscripts.DeclarativeWebScript;
import org.springframework.extensions.webscripts.ScriptableMap;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.WebScriptRequest;

/**
 * @author Axel Faust
 */
public class AlfrescoScriptAPITernGet extends DeclarativeWebScript implements InitializingBean
{

    private static final Collection<Class<?>> PRIMITIVE_NUMBER_CLASSES = Collections.unmodifiableList(Arrays.<Class<?>> asList(byte.class,
            short.class, int.class, long.class, float.class, double.class));

    private static final Collection<Class<?>> CUTOFF_CLASSES = Collections.unmodifiableList(Arrays.<Class<?>> asList(Object.class,
            Scriptable.class, BaseProcessorExtension.class, BaseScopableProcessorExtension.class, ScriptableObject.class, List.class, Map.class));

    private static final Collection<Class<?>> CUTOFF_INTERFACES = Collections.unmodifiableList(Arrays.<Class<?>> asList(Scriptable.class,
            Scopeable.class, ApplicationContextAware.class, InitializingBean.class, DisposableBean.class));

    private static final Collection<String> INIT_METHOD_NAMES = Collections.unmodifiableSet(new HashSet<String>(Arrays.<String> asList(
            "init", "register")));

    private static final ParameterNameDiscoverer PARAMETER_NAME_DISCOVERER = new LocalVariableTableParameterNameDiscoverer();

    protected NamespaceService namespaceService;

    protected DictionaryService dictionaryService;

    protected ScriptService scriptService;

    protected PersonService personService;

    protected ServiceRegistry serviceRegistry;

    protected BaseProcessor scriptProcessor;

    protected Properties properties;

    /**
     * {@inheritDoc}
     */
    @Override
    public void afterPropertiesSet()
    {
        PropertyCheck.mandatory(this, "namespaceService", this.namespaceService);
        PropertyCheck.mandatory(this, "dictionaryService", this.dictionaryService);
        PropertyCheck.mandatory(this, "scriptService", this.scriptService);
        PropertyCheck.mandatory(this, "personService", this.personService);
        PropertyCheck.mandatory(this, "serviceRegistry", this.serviceRegistry);
        PropertyCheck.mandatory(this, "scriptProcessor", this.scriptProcessor);

        PropertyCheck.mandatory(this, "properties", this.properties);
    }

    /**
     * @param namespaceService
     *            the namespaceService to set
     */
    public void setNamespaceService(final NamespaceService namespaceService)
    {
        this.namespaceService = namespaceService;
    }

    /**
     * @param dictionaryService
     *            the dictionaryService to set
     */
    public void setDictionaryService(final DictionaryService dictionaryService)
    {
        this.dictionaryService = dictionaryService;
    }

    /**
     * @param scriptService
     *            the scriptService to set
     */
    public void setScriptService(final ScriptService scriptService)
    {
        this.scriptService = scriptService;
    }

    /**
     * @param personService
     *            the personService to set
     */
    public void setPersonService(final PersonService personService)
    {
        this.personService = personService;
    }

    /**
     * @param serviceRegistry
     *            the serviceRegistry to set
     */
    public void setServiceRegistry(final ServiceRegistry serviceRegistry)
    {
        this.serviceRegistry = serviceRegistry;
    }

    /**
     * @param scriptProcessor
     *            the scriptProcessor to set
     */
    public void setScriptProcessor(final BaseProcessor scriptProcessor)
    {
        this.scriptProcessor = scriptProcessor;
    }

    /**
     * @param properties
     *            the properties to set
     */
    public void setProperties(final Properties properties)
    {
        this.properties = properties;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected Map<String, Object> executeImpl(final WebScriptRequest req, final Status status, final Cache cache)
    {
        final Map<String, Object> model = new HashMap<String, Object>();

        this.prepareJavaTypeDefinitions(model);
        this.preparePropertyDefinitions(model);
        // TODO Process action definitions + parameters
        // this.prepareGlobalDefinitions(model);

        return model;
    }

    protected void prepareJavaTypeDefinitions(final Map<String, Object> model)
    {
        final List<Map<String, Object>> typeDefinitions = new ArrayList<Map<String, Object>>();

        final Collection<Class<?>> classesToDescribe = new HashSet<Class<?>>();
        final Collection<Class<?>> classesDescribed = new HashSet<Class<?>>();

        classesToDescribe.addAll(Arrays.asList(String.class, Boolean.class, Number.class, Date.class));
        final Map<String, Object> defaultModel = this.buildDefaultModel();
        for (final Object value : defaultModel.values())
        {
            classesToDescribe.add(value.getClass());
        }

        while (classesToDescribe.size() > classesDescribed.size())
        {
            final Collection<Class<?>> remainingClasses = new HashSet<Class<?>>(classesToDescribe);
            remainingClasses.removeAll(classesDescribed);

            for (final Class<?> cls : remainingClasses)
            {
                final String typeClsName = cls.getName();
                final String typePrefix = "type." + typeClsName;
                final String skip = this.properties.getProperty(typePrefix + ".skip");

                if (skip == null || skip.isEmpty() || !Boolean.parseBoolean(skip))
                {
                    final Map<String, Object> typeDefinition = new HashMap<String, Object>();
                    final Collection<Class<?>> relatedClasses = this.fillClassTypeDefinition(cls, typeDefinition);
                    classesToDescribe.addAll(relatedClasses);
                    typeDefinitions.add(typeDefinition);
                }
                classesDescribed.add(cls);
            }
        }

        model.put("javaTypeDefinitions", typeDefinitions);
    }

    protected Collection<Class<?>> fillClassTypeDefinition(final Class<?> cls, final Map<String, Object> typeDefinition)
    {
        final Collection<Class<?>> relatedClasses = new HashSet<Class<?>>();

        final String clsName = cls.getName();
        final String commonPrefix = "type." + clsName;

        String name = cls.getSimpleName();
        final String ternName = this.properties.getProperty(commonPrefix + ".ternName");
        if (ternName != null && !ternName.isEmpty())
        {
            name = ternName;
        }
        typeDefinition.put("name", name);

        // support I18n for any documentation
        final String i18nKey = "javascript-console.tern." + commonPrefix + ".ternDoc";
        String ternDoc = I18NUtil.getMessage(i18nKey);
        if (ternDoc == null || ternDoc.isEmpty() || ternDoc.equals(i18nKey))
        {
            ternDoc = this.properties.getProperty(commonPrefix + ".ternDoc");
        }
        if (ternDoc != null && !ternDoc.isEmpty())
        {
            typeDefinition.put("doc", ternDoc);
        }

        String ternUrl = this.properties.getProperty(commonPrefix + ".ternUrl");
        if ((ternUrl == null || ternUrl.isEmpty()) && clsName.startsWith("org.alfresco."))
        {
            ternUrl = "http://dev.alfresco.com/resource/docs/java/" + clsName.replace('.', '/') + ".html";
        }

        if (ternUrl != null && !ternUrl.isEmpty())
        {
            typeDefinition.put("url", ternUrl);
        }

        final Class<?> superclass = cls.getSuperclass();
        if (superclass != null && !CUTOFF_CLASSES.contains(superclass))
        {
            relatedClasses.add(superclass);

            final String superClsName = superclass.getName();
            final String superPrefix = "type." + superClsName;
            String superName = superclass.getSimpleName();
            final String superTernName = this.properties.getProperty(superPrefix + ".ternName");
            if (superTernName != null && !superTernName.isEmpty())
            {
                superName = superTernName;
            }
            typeDefinition.put("prototype", superName);
        }

        final String nameOnly = this.properties.getProperty(commonPrefix + ".nameOnly");
        if (nameOnly == null || nameOnly.isEmpty() || !Boolean.parseBoolean(nameOnly))
        {
            this.fillClassTypeMemberDefinitions(cls, typeDefinition, relatedClasses, commonPrefix, superclass);
        }

        return relatedClasses;
    }

    protected void fillClassTypeMemberDefinitions(final Class<?> cls, final Map<String, Object> typeDefinition,
            final Collection<Class<?>> relatedClasses, final String commonPrefix, final Class<?> superclass)
    {
        final List<Map<String, Object>> memberDefinitions = new ArrayList<Map<String, Object>>();
        final Map<String, AtomicInteger> usedMemberNames = new HashMap<String, AtomicInteger>();
        final Collection<String> handledProperties = new HashSet<String>();

        final List<Method> methods = this.collectDocumentableMethods(cls);

        for (final Method method : methods)
        {
            final String methodName = method.getName();
            final String memberName;
            Map<String, Object> memberDefinition = null;

            if (methodName.matches("^get[A-Z].*$") && method.getParameterTypes().length == 0)
            {
                memberName = methodName.substring(3, 4).toLowerCase(Locale.ENGLISH) + methodName.substring(4);
                if (!handledProperties.contains(memberName))
                {
                    memberDefinition = this.buildClassPropertyMemberDefinition(cls, method, commonPrefix, memberName, relatedClasses);
                    if (memberDefinition != null)
                    {
                        handledProperties.add(memberName);
                    }
                }
            }
            else if (methodName.matches("^set[A-Z].*$") && method.getParameterTypes().length == 1)
            {
                memberName = methodName;
                final Class<?> parameterType = method.getParameterTypes()[0];

                boolean isPropertyRelated;
                final String getterName = "get" + methodName.substring(3);
                try
                {
                    final Method getter = cls.getMethod(getterName);
                    isPropertyRelated = getter.getReturnType().equals(parameterType);
                }
                catch (final NoSuchMethodException nsmex)
                {
                    isPropertyRelated = false;
                }

                if (!isPropertyRelated)
                {
                    memberDefinition = this.buildClassMethodMemberDefinition(cls, method, commonPrefix, relatedClasses);
                }
            }
            else
            {
                memberName = methodName;
                memberDefinition = this.buildClassMethodMemberDefinition(cls, method, commonPrefix, relatedClasses);
            }

            if (memberDefinition != null)
            {
                memberDefinitions.add(memberDefinition);

                AtomicInteger count = usedMemberNames.get(memberName);
                if (count == null)
                {
                    count = new AtomicInteger(1);
                    usedMemberNames.put(memberName, count);
                }
                else
                {
                    memberDefinition.put("name", memberName + count.incrementAndGet());
                }
            }
        }
        typeDefinition.put("members", memberDefinitions);
    }

    protected List<Method> collectDocumentableMethods(final Class<?> cls)
    {
        // collect classes in hierarchy from base to special
        final List<Class<?>> classHierarchy = new LinkedList<Class<?>>();
        Class<?> curCls = cls;
        while (curCls != null)
        {
            classHierarchy.add(0, curCls);

            final Collection<Class<?>> interfaces = new HashSet<Class<?>>(Arrays.asList(curCls.getInterfaces()));

            // interfaces are the collection of superclasses for an interface
            if (curCls.isInterface())
            {
                // TODO Handle transitive interface extensions if this becomes a relevant issue
                classHierarchy.addAll(0, interfaces);
            }

            // include cutoff interfaces earlier so we capture method definitions before implementations / redefinition
            interfaces.retainAll(CUTOFF_INTERFACES);
            if (!interfaces.isEmpty())
            {
                classHierarchy.addAll(0, interfaces);
            }

            if (Object.class.equals(curCls))
            {
                curCls = null;
            }
            else
            {
                if (!interfaces.isEmpty())
                {
                    curCls = Object.class;
                }
                else
                {
                    curCls = curCls.getSuperclass();
                }
            }
        }

        // interfaces don't explicitly contain Object in their hierarchy and some define Object-original methods too
        if (!classHierarchy.contains(Object.class))
        {
            classHierarchy.add(Object.class);
        }

        // collect declared public methods (other than cls.getMethods we don't want overriden methods, only initial implementations)
        final Map<Pair<String, List<Class<?>>>, Method> methodsByNameAndParameterTypes = new HashMap<Pair<String, List<Class<?>>>, Method>();
        while (!classHierarchy.isEmpty())
        {
            curCls = classHierarchy.remove(0);
            final Method[] declaredMethods = curCls.getDeclaredMethods();
            for (final Method declaredMethod : declaredMethods)
            {
                final String methodName = declaredMethod.getName();

                if (Modifier.isPublic(declaredMethod.getModifiers()) && !Modifier.isStatic(declaredMethod.getModifiers()))
                {
                    final Pair<String, List<Class<?>>> key = new Pair<String, List<Class<?>>>(methodName, Arrays.asList(declaredMethod
                            .getParameterTypes()));
                    if (!methodsByNameAndParameterTypes.containsKey(key))
                    {
                        methodsByNameAndParameterTypes.put(key, declaredMethod);
                    }
                }
            }
        }

        // filter and collect methods
        final List<Method> documentableMethods = new ArrayList<Method>();

        for (final Method method : methodsByNameAndParameterTypes.values())
        {
            if (cls.equals(method.getDeclaringClass()))
            {
                // ignore potential initialization setters / methods
                final String methodName = method.getName();
                if (BaseProcessorExtension.class.isAssignableFrom(method.getDeclaringClass())
                        && (INIT_METHOD_NAMES.contains(methodName) || methodName.matches("^[sg]et[A-Z].+Service$") || (methodName
                                .matches("^set[A-Z].+$") && method.getParameterTypes().length == 1)))
                {
                    // skip
                    continue;
                }

                documentableMethods.add(method);
            }
        }

        Collections.sort(documentableMethods, new Comparator<Method>()
        {

            /**
             *
             * {@inheritDoc}
             */
            @Override
            public int compare(final Method a, final Method b)
            {
                final String aName = a.getName();
                final String bName = b.getName();

                int result = aName.compareTo(bName);
                if (result == 0)
                {
                    final int aArgLength = a.getParameterTypes().length;
                    final int bArgLength = b.getParameterTypes().length;

                    if (aArgLength != bArgLength)
                    {
                        result = aArgLength - bArgLength;
                    }
                }

                return result;
            }
        });

        return documentableMethods;
    }

    protected Map<String, Object> buildClassMethodMemberDefinition(final Class<?> cls, final Method method, final String commonPrefix,
            final Collection<Class<?>> relatedClasses)
    {
        final Map<String, Object> memberDefinition;

        final Class<?> realReturnType = method.getReturnType();
        Class<?> effectiveReturnType = realReturnType;

        final Class<?>[] realParameterTypes = method.getParameterTypes();

        final String methodName = method.getName();
        final String simpleMethodPrefix = commonPrefix + "." + methodName;
        final String methodPrefix = this.buildMethodPrefix(commonPrefix, realReturnType, realParameterTypes, methodName);

        String skip = this.properties.getProperty(methodPrefix + ".skip");
        if (skip == null || skip.isEmpty())
        {
            skip = this.properties.getProperty(simpleMethodPrefix + ".skip");
        }

        if (skip == null || skip.isEmpty() || !Boolean.parseBoolean(skip))
        {
            memberDefinition = new HashMap<String, Object>();
            effectiveReturnType = this.determineEffectiveType(realReturnType, effectiveReturnType, methodPrefix);
            final Class<?> returnType = this.determineType(effectiveReturnType, relatedClasses);

            final Class<?>[] effectiveParameterTypes = new Class<?>[realParameterTypes.length];
            final Class<?>[] parameterTypes = new Class<?>[realParameterTypes.length];
            System.arraycopy(realParameterTypes, 0, effectiveParameterTypes, 0, realParameterTypes.length);

            for (int idx = 0; idx < parameterTypes.length; idx++)
            {
                effectiveParameterTypes[idx] = this.determineEffectiveType(realParameterTypes[idx], effectiveParameterTypes[idx],
                        methodPrefix + ".arg" + idx);
                parameterTypes[idx] = this.determineType(effectiveParameterTypes[idx], relatedClasses);
            }

            memberDefinition.put("name", methodName);

            final String methodType = this.buildMethodTypeDescription(method, realReturnType, effectiveReturnType, returnType,
                    effectiveParameterTypes, parameterTypes, methodPrefix);
            memberDefinition.put("type", methodType);

            // support I18n for any documentation
            final String i18nKey = "javascript-console.tern." + methodPrefix + ".ternDoc";
            String ternDoc = I18NUtil.getMessage(i18nKey);
            if (ternDoc == null || ternDoc.isEmpty() || ternDoc.equals(i18nKey))
            {
                ternDoc = this.properties.getProperty(methodPrefix + ".ternDoc");
            }
            if (ternDoc != null && !ternDoc.isEmpty())
            {
                memberDefinition.put("doc", ternDoc);
            }
        }
        else
        {
            memberDefinition = null;
        }

        return memberDefinition;
    }

    protected Map<String, Object> buildClassPropertyMemberDefinition(final Class<?> cls, final Method getter, final String commonPrefix,
            final String propertyName, final Collection<Class<?>> relatedClasses)
    {
        final Map<String, Object> memberDefinition;

        final Class<?> realReturnType = getter.getReturnType();
        Class<?> effectiveReturnType = realReturnType;

        final String propertyPrefix = commonPrefix + "." + propertyName;

        final String skip = this.properties.getProperty(propertyPrefix + ".skip");

        if (skip == null || skip.isEmpty() || !Boolean.parseBoolean(skip))
        {
            memberDefinition = new HashMap<String, Object>();
            effectiveReturnType = this.determineEffectiveType(realReturnType, effectiveReturnType, propertyPrefix);
            final Class<?> returnType = this.determineType(effectiveReturnType, relatedClasses);

            final String returnTypeClsName = returnType.getName();
            final String returnTypePrefix = "type." + returnTypeClsName;

            String returnTypeName = returnType.getSimpleName();
            if (Object.class.equals(returnType))
            {
                returnTypeName = "+" + returnTypeName;
            }

            final String propertyTypeTernName = this.properties.getProperty(propertyPrefix + ".typeTernName");
            if (propertyTypeTernName != null && !propertyTypeTernName.isEmpty())
            {
                returnTypeName = propertyTypeTernName;
            }
            else
            {
                String returnTypeTernName = this.properties.getProperty(returnTypePrefix + ".returnTypeTernName");
                if (returnTypeTernName == null || returnTypeName.isEmpty())
                {
                    returnTypeTernName = this.properties.getProperty(returnTypePrefix + ".ternName");
                }

                if (returnTypeTernName != null && !returnTypeTernName.isEmpty())
                {
                    returnTypeName = returnTypeTernName;
                }
            }

            if (effectiveReturnType.isArray() && !(returnTypeName.startsWith("[") && returnTypeName.endsWith("[")))
            {
                returnTypeName = "[" + returnTypeName + "]";
            }

            memberDefinition.put("name", propertyName);
            memberDefinition.put("type", returnTypeName);

            // support I18n for any documentation
            final String i18nKey = "javascript-console.tern." + propertyPrefix + ".ternDoc";
            String ternDoc = I18NUtil.getMessage(i18nKey);
            if (ternDoc == null || ternDoc.isEmpty() || ternDoc.equals(i18nKey))
            {
                ternDoc = this.properties.getProperty(propertyPrefix + ".ternDoc");
            }
            if (ternDoc != null && !ternDoc.isEmpty())
            {
                memberDefinition.put("doc", ternDoc);
            }

            boolean readOnly;
            final String setterName = "set" + getter.getName().substring(3);
            try
            {
                cls.getMethod(setterName, realReturnType);
                readOnly = false;
            }
            catch (final NoSuchMethodException nsmex)
            {
                readOnly = true;
            }
            memberDefinition.put("readOnly", Boolean.valueOf(readOnly));
        }
        else
        {
            memberDefinition = null;
        }

        return memberDefinition;
    }

    protected Class<?> determineEffectiveType(final Class<?> realReturnType, final Class<?> baseEffectiveReturnType, final String prefix)
    {
        Class<?> effectiveReturnType = baseEffectiveReturnType;
        if (!(void.class.equals(realReturnType) || Void.class.equals(realReturnType)))
        {
            // due to bad return type in Java code we may need to specify overrides on a per-use-case level
            final String returnTypeClassName = this.properties.getProperty(prefix + ".typeClassName");
            if (returnTypeClassName != null && !returnTypeClassName.isEmpty())
            {
                try
                {
                    effectiveReturnType = Class.forName(returnTypeClassName);
                }
                catch (final ClassNotFoundException cnfex)
                {
                    // TODO log
                }
            }
        }
        return effectiveReturnType;
    }

    protected Class<?> determineType(final Class<?> inType, final Collection<Class<?>> relatedClasses)
    {
        Class<?> type = inType;
        if (PRIMITIVE_NUMBER_CLASSES.contains(type) || Number.class.isAssignableFrom(type))
        {
            type = Number.class;
        }
        else if (boolean.class.equals(type))
        {
            type = Boolean.class;
        }
        else if (char.class.equals(type))
        {
            type = Character.class;
        }
        else if (Date.class.isAssignableFrom(type))
        {
            type = Date.class;
        }
        else if (type.isArray())
        {
            type = type.getComponentType();
            if (PRIMITIVE_NUMBER_CLASSES.contains(type) || Number.class.isAssignableFrom(type))
            {
                type = Number.class;
            }
            else if (boolean.class.equals(type))
            {
                type = Boolean.class;
            }
            else if (char.class.equals(type))
            {
                type = Character.class;
            }
            else if (Date.class.isAssignableFrom(type))
            {
                type = Date.class;
            }
            else
            {
                relatedClasses.add(type);
            }
        }
        else if (ScriptableMap.class.isAssignableFrom(type) || NativeMap.class.isAssignableFrom(type)
                || ScriptableHashMap.class.isAssignableFrom(type))
        {
            // treat as a common object
            type = Object.class;
        }
        else if (Map.class.isAssignableFrom(type))
        {
            type = Map.class;
            relatedClasses.add(type);
        }
        else if (List.class.isAssignableFrom(type))
        {
            type = List.class;
            relatedClasses.add(type);
        }
        else if (!(Scriptable.class.equals(type) || Object.class.equals(type) || void.class.equals(type) || Void.class.equals(type)))
        {
            relatedClasses.add(type);
        }
        return type;
    }

    protected String buildMethodPrefix(final String commonPrefix, final Class<?> realReturnType, final Class<?>[] realParameterTypes,
            final String methodName)
    {
        final StringBuilder signatureKeyBuilder = new StringBuilder();
        if (!(void.class.equals(realReturnType) || Void.class.equals(realReturnType)))
        {
            signatureKeyBuilder.append(".out.");
            signatureKeyBuilder.append(realReturnType.getSimpleName());
        }
        if (realParameterTypes.length > 0)
        {
            signatureKeyBuilder.append(".in");
            for (final Class<?> realParameterType : realParameterTypes)
            {
                signatureKeyBuilder.append(".");
                signatureKeyBuilder.append(realParameterType.getSimpleName());
            }
        }
        final String methodPrefix = commonPrefix + "." + methodName + signatureKeyBuilder;
        return methodPrefix;
    }

    protected String buildMethodTypeDescription(final Method method, final Class<?> realReturnType, final Class<?> effectiveReturnType,
            final Class<?> returnType, final Class<?>[] effectiveParameterTypes, final Class<?>[] parameterTypes, final String methodPrefix)
    {
        final StringBuilder typeBuilder = new StringBuilder();
        typeBuilder.append("fn(");
        if (parameterTypes.length > 0)
        {
            final String[] parameterNames = PARAMETER_NAME_DISCOVERER.getParameterNames(method);

            for (int idx = 0; idx < parameterTypes.length; idx++)
            {
                String parameterName = this.properties.getProperty(methodPrefix + ".arg" + idx + ".name");
                if ((parameterName == null || parameterName.isEmpty()) && parameterNames != null)
                {
                    parameterName = parameterNames[idx];
                }
                if (parameterName == null || parameterName.isEmpty())
                {
                    parameterName = "arg" + idx;
                }

                String typeName = parameterTypes[idx].getSimpleName();
                if (Object.class.equals(parameterTypes[idx]))
                {
                    typeName = "+" + typeName;
                }
                // Rhino transparently handles native to Java type conversions for core types
                else if (Number.class.equals(parameterTypes[idx]))
                {
                    typeName = "number";
                }
                else if (CharSequence.class.isAssignableFrom(parameterTypes[idx]))
                {
                    typeName = "string";
                }
                else if (Boolean.class.equals(parameterTypes[idx]))
                {
                    typeName = "bool";
                }

                final String parameterTypeTernName = this.properties.getProperty(methodPrefix + ".arg" + idx + ".typeTernName");
                if (parameterTypeTernName != null && !parameterTypeTernName.isEmpty())
                {
                    typeName = parameterTypeTernName;
                }
                else
                {
                    final String typeClsName = parameterTypes[idx].getName();
                    final String typePrefix = "type." + typeClsName;
                    String typeTernName = this.properties.getProperty(typePrefix + ".paramTypeTernName");
                    if (typeTernName == null || typeTernName.isEmpty())
                    {
                        typeTernName = this.properties.getProperty(typePrefix + ".typeTernName");
                    }
                    if (typeTernName != null && !typeTernName.isEmpty())
                    {
                        typeName = typeTernName;
                    }
                }

                if (effectiveParameterTypes[idx].isArray() && !(typeName.startsWith("[") && typeName.endsWith("[")))
                {
                    typeName = "[" + typeName + "]";
                }

                if (idx != 0)
                {
                    typeBuilder.append(", ");
                }

                typeBuilder.append(parameterName);
                typeBuilder.append(": ");
                typeBuilder.append(typeName);
            }
        }
        typeBuilder.append(")");
        if (!(void.class.equals(realReturnType) || Void.class.equals(realReturnType)))
        {
            typeBuilder.append(" -> ");

            String returnTypeName = returnType.getSimpleName();
            if (Object.class.equals(returnType))
            {
                returnTypeName = "+" + returnTypeName;
            }

            final String propertyTypeTernName = this.properties.getProperty(methodPrefix + ".returnTypeTernName");
            if (propertyTypeTernName != null && !propertyTypeTernName.isEmpty())
            {
                returnTypeName = propertyTypeTernName;
            }
            else
            {
                final String returnTypeClsName = returnType.getName();
                final String returnTypePrefix = "type." + returnTypeClsName;
                String returnTypeTernName = this.properties.getProperty(returnTypePrefix + ".returnTypeTernName");
                if (returnTypeTernName == null || returnTypeName.isEmpty())
                {
                    returnTypeTernName = this.properties.getProperty(returnTypePrefix + ".ternName");
                }
                if (returnTypeTernName != null && !returnTypeTernName.isEmpty())
                {
                    returnTypeName = returnTypeTernName;
                }
            }

            if (effectiveReturnType.isArray() && !(returnTypeName.startsWith("[") && returnTypeName.endsWith("[")))
            {
                returnTypeName = "[" + returnTypeName + "]";
            }

            typeBuilder.append(returnTypeName);
        }
        final String methodType = typeBuilder.toString();
        return methodType;
    }

    protected Map<String, Object> buildDefaultModel()
    {
        final String userName = AuthenticationUtil.getFullyAuthenticatedUser();
        final NodeRef person = this.personService.getPerson(userName);
        // the specific values of companyHome, userHome, script, document and space are irrelevant for type analysis
        final Map<String, Object> defaultModel = this.scriptService.buildDefaultModel(person, person, person, person, person, person);

        for (final Entry<String, Object> modelEntry : defaultModel.entrySet())
        {
            if (modelEntry.getValue() instanceof NodeRef)
            {
                modelEntry.setValue(new ScriptNode((NodeRef) modelEntry.getValue(), this.serviceRegistry));
            }
        }

        final Collection<ProcessorExtension> processorExtensions = this.scriptProcessor.getProcessorExtensions();
        for (final ProcessorExtension extension : processorExtensions)
        {
            if (!defaultModel.containsKey(extension.getExtensionName()))
            {
                defaultModel.put(extension.getExtensionName(), extension);
            }
        }

        return defaultModel;
    }

    protected void preparePropertyDefinitions(final Map<String, Object> model)
    {
        final Collection<QName> taskTypes = this.dictionaryService.getSubTypes(WorkflowModel.TYPE_TASK, true);
        final Collection<QName> taskAspects = this.collectTaskAspects(taskTypes);

        model.put("taskProperties", this.buildPropertyDefinitions(taskTypes, taskAspects));

        // though task types could technically be used for nodes (task derives from cm:content) they rarely are
        final Collection<QName> nodeTypes = new HashSet<QName>(this.dictionaryService.getAllTypes());
        nodeTypes.removeAll(nodeTypes);
        final Collection<QName> nodeAspects = this.dictionaryService.getAllAspects();

        model.put("nodeProperties", this.buildPropertyDefinitions(nodeTypes, nodeAspects));
    }

    protected List<PropertyDefinition> buildPropertyDefinitions(final Collection<QName> types, final Collection<QName> aspects)
    {
        final List<PropertyDefinition> propertyDefinitions = new ArrayList<PropertyDefinition>();

        final Collection<QName> allClasses = new HashSet<QName>();
        allClasses.addAll(types);
        allClasses.addAll(aspects);

        for (final QName cls : allClasses)
        {
            propertyDefinitions.addAll(this.buildPropertyDefinitions(cls));
        }

        return propertyDefinitions;
    }

    protected List<PropertyDefinition> buildPropertyDefinitions(final QName cls)
    {
        final ClassDefinition classDefinition = this.dictionaryService.getClass(cls);

        final Map<QName, PropertyDefinition> properties = classDefinition.getProperties();
        final Map<QName, PropertyDefinition> parentProperties = classDefinition.getParentName() != null ? classDefinition
                .getParentClassDefinition().getProperties() : Collections.<QName, PropertyDefinition> emptyMap();

        final List<PropertyDefinition> propertyDefinitions = new ArrayList<PropertyDefinition>();

        for (final Entry<QName, PropertyDefinition> propertyEntry : properties.entrySet())
        {
            if (!parentProperties.containsKey(propertyEntry.getKey()))
            {
                propertyDefinitions.add(propertyEntry.getValue());
            }
        }

        return propertyDefinitions;
    }

    protected Collection<QName> collectTaskAspects(final Collection<QName> taskTypes)
    {
        final Collection<QName> taskAspects = new HashSet<QName>();
        for (final QName taskType : taskTypes)
        {
            final TypeDefinition type = this.dictionaryService.getType(taskType);
            taskAspects.addAll(type.getDefaultAspectNames());
        }

        boolean taskAspectsChanged = true;
        while (taskAspectsChanged)
        {
            taskAspectsChanged = false;
            for (final QName taskAspect : taskAspects)
            {
                final AspectDefinition aspect = this.dictionaryService.getAspect(taskAspect);
                taskAspectsChanged = taskAspects.addAll(aspect.getDefaultAspectNames()) || taskAspectsChanged;
                if (aspect.getParentName() != null)
                {
                    taskAspectsChanged = taskAspects.add(aspect.getParentName()) || taskAspectsChanged;
                }
            }
        }

        return taskAspects;
    }
}
