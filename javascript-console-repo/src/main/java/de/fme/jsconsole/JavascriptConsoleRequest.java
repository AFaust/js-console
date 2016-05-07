package de.fme.jsconsole;

import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.HashMap;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.springframework.extensions.surf.util.Content;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.WebScriptException;
import org.springframework.extensions.webscripts.WebScriptRequest;

/**
 * Parses and stores the input data for the Javascript Console {@link ExecuteWebscript} and contains
 * the logic to decode the request body JSON data.
 *
 * @author Florian Maul (fme AG)
 *
 */
public class JavascriptConsoleRequest {

	private static final int DEFAULT_DUMP_LIMIT = 10;

	public final String script;
	public final String template;
	public final String spaceNodeRef;
	public final String runas;
	public final boolean useTransaction;
	public final boolean transactionReadOnly;
	public final Map<String, String> urlargs;
	public final String documentNodeRef;
	public final Integer dumpLimit;

	public final String resultChannel;

	private JavascriptConsoleRequest(final String script, final String template,
            final String spaceNodeRef, final String transaction, final String runas, final String urlargs, final String documentNodeRef, final Integer dumpLimit, final String resultChannel) {
        super();
        this.script = script;
        this.template = template;
        this.spaceNodeRef = spaceNodeRef;
        this.documentNodeRef = documentNodeRef;
		this.dumpLimit = dumpLimit;
        this.urlargs = parseQueryString(urlargs);
        this.transactionReadOnly = "readonly".equalsIgnoreCase(transaction);
        this.useTransaction = this.transactionReadOnly || "readwrite".equalsIgnoreCase(transaction);
        this.runas = runas;
        this.resultChannel = resultChannel;
    }

	/**
     * parses the query string
     * is used because HttpUtils.parseQueryString is deprecated
     * @param queryString
     * @return
     */
    protected static Map<String, String> parseQueryString(final String queryString) {
        final Map<String, String> map = new HashMap<String, String>();

        if (queryString != null) {
            final String[] parameters = queryString.split("&");
            for(int i = 0; i < parameters.length; i++) {
                final String[] keyAndValue = parameters[i].split("=");
                if(keyAndValue.length != 2) {
                    // "invalid url parameter " + parameters[i]);
                    continue;
                }
                final String key = keyAndValue[0];
                final String value = keyAndValue[1];
                map.put(key, value);
            }
        }

        return map;
    }

	public static JavascriptConsoleRequest readJson(final WebScriptRequest request) {
		final Content content = request.getContent();

		final InputStreamReader br = new InputStreamReader(content.getInputStream(),
				Charset.forName("UTF-8"));
		final JSONTokener jsonTokener = new JSONTokener(br);
		try {
			final JSONObject jsonInput = new JSONObject(jsonTokener);

			final String script = jsonInput.has("script") ? jsonInput.getString("script") : null;
			final String template = jsonInput.has("template") ? jsonInput.getString("template"): null;
			final String spaceNodeRef = jsonInput.has("spaceNodeRef") ? jsonInput.getString("spaceNodeRef") : null;
			final String transaction = jsonInput.has("transaction") ? jsonInput.getString("transaction") : null;
			final String urlargs = jsonInput.has("urlargs") ? jsonInput.getString("urlargs"): null;
			final String documentNodeRef = jsonInput.has("documentNodeRef") ? jsonInput.getString("documentNodeRef") : null;

			int dumpLimit = DEFAULT_DUMP_LIMIT;
			if (jsonInput.has("dumpLimit")) {
				dumpLimit = jsonInput.getInt("dumpLimit");
			}

			final String resultChannel = jsonInput.has("resultChannel") ? jsonInput.getString("resultChannel") : null;
			final String runas = jsonInput.has("runas") ? jsonInput.getString("runas") : null;

			return new JavascriptConsoleRequest(script, template, spaceNodeRef, transaction, runas, urlargs, documentNodeRef, dumpLimit, resultChannel);

		} catch (final JSONException e) {
			throw new WebScriptException(Status.STATUS_INTERNAL_SERVER_ERROR,
					"Error reading json request body.", e);
		}
	}

	@Override
	public String toString() {
		return "JavascriptConsoleRequest [script=" + this.script + ", template=" + this.template + ", spaceNodeRef=" + this.spaceNodeRef
				+ ", runas=" + this.runas + ", useTransaction=" + this.useTransaction + ", transactionReadOnly=" + this.transactionReadOnly
				+ ", urlargs=" + this.urlargs + ", documentNodeRef=" + this.documentNodeRef + ", dumpLimit=" + this.dumpLimit + ", resultChannel=" + this.resultChannel + "]";
	}

}
