import { useEffect, useMemo } from "react";
import { Outlet, NavLink, Link, useLoaderData, Form, redirect, useNavigation, useSubmit } from "react-router-dom";
import { getContacts, createContact } from "../contacts";

export async function action() {
    const contact = await createContact();
    return redirect(`/contacts/${contact.id}/edit`);
}

// trying another memoization
const contactsCache = new Map();

export async function loader({ request }) {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");

    // without memoization
    /* console.time('timer (no memo)');
    const contacts = await getContacts(q);
    console.timeEnd('timer (no memo)'); */

    // with memoization: useMemo cannot work inside simple functions
    // cannot work: can only be used inside a functional component or custom hook
    // const contacts = useMemo( async () => await getContacts(q), [q]);

    // memoization method 2
    console.time('timer (memo)');
    if (contactsCache.has(q)) {
        return { contacts: contactsCache.get(q), q};
    }
    console.timeEnd('timer (memo)');
    const contacts = await getContacts(q);
    contactsCache.set(q, contacts);

    return { contacts, q };
}

export default function Root() {
    const { contacts, q } = useLoaderData();
    const navigation = useNavigation();
    const submit = useSubmit();

    const searching = 
        navigation.location && 
        new URLSearchParams(navigation.location.search).has("q");

    useEffect(() => {
        document.getElementById("q").value = q;
    }, [q]);

    return (
        <>
            <div id="sidebar">
                <h1>React Router Contacts</h1>
                <div>
                    <Form id="search-form" role="search">
                        <input 
                        type="search" 
                        id="q"
                        className={searching ? "loading" : ""} 
                        aria-label="Search contacts" 
                        placeholder="Search" 
                        name="q" 
                        defaultValue={q}
                            onChange={(event) => {
                                const isFirstSearch = q == null;
                                submit(event.currentTarget.form, {
                                    replace: !isFirstSearch,
                                });
                            }}
                        />
                        <div id="search-spinner" aria-hidden hidden={!searching} />
                        <div className="sr-only" aria-live="polite"></div>
                    </Form>
                    <Form method="post">
                        <button type="submit">New</button>
                    </Form>
                </div>
                <nav>
                    {/* <ul>
                        <li><Link to={`contacts/1`}>Your Name</Link></li>
                        <li><Link to={`contacts/2`}>Your Friend</Link></li>
                    </ul> */}
                    {contacts.length ? (
                        <ul>
                            {contacts.map((contact) => (
                                <li key={contact.id}>
                                    {/* <Link to={`contacts/${contact.id}`}>
                                        { contact.first || contact.last? (
                                            <>
                                            { contact.first } { contact.last }
                                        </>
                                        ) : (
                                            <i>No Name</i>
                                        )}{ " "}
                                        { contact.favorite && <span>★</span>}
                                    </Link> */}
                                    <NavLink
                                        to={`contacts/${contact.id}`}
                                        className={({ isActive, isPending }) =>
                                            isActive ? "active" : isPending ? "pending" : ""
                                        }
                                    >
                                        {contact.first || contact.last ? (
                                            <>
                                                {contact.first} {contact.last}
                                            </>
                                        ) : (
                                            <i>No Name</i>
                                        )}{" "}
                                        {contact.favorite && <span>★</span>}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>
                            <i>No contacts</i>
                        </p>
                    )}
                </nav>
            </div>
            <div
                id="detail"
                className={
                    navigation.state === "loading" ? "loading" : ""
                }
            >
                <Outlet />
            </div>
        </>
    );
}