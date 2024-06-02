import { createClient } from "@/utils/supabase/server";
import { CheckIcon } from "@heroicons/react/24/solid";
import { Client } from "@notionhq/client";
import { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import classNames from "classnames";
import Image from "next/image";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = user
    ? await supabase
        .from("notion_token")
        .select("access_token")
        .eq("user_id", user.id)
        .single()
    : { data: null };

  const notion = data?.access_token
    ? new Client({
        auth: data?.access_token,
      })
    : null;
  const meta = user?.user_metadata;
  const steps = [
    {
      name: "Step 1",
      description: "Sign in to notion",
      href: "/login",
      status: "complete",
    },
    {
      name: "Step 2",
      description: "Choose your database to store voice notes",
      href: "#",
      status: "current",
    },
    {
      name: "Step 3",
      description: "Add the Voice Notes GPT",
      href: "#",
      status: "upcoming",
    },
  ];
  const { results } = (await notion?.search({
    page_size: 100,
    filter: { property: "object", value: "database" },
  })) || { results: [] };
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="mx-auto max-w-3xl flex items-stretch">
        <nav aria-label="Progress">
          <ol role="list" className="overflow-hidden">
            {steps.map((step, stepIdx) => (
              <li
                key={step.name}
                className={classNames(
                  stepIdx !== steps.length - 1 ? "pb-10" : "",
                  "relative",
                )}
              >
                {step.status === "complete" ? (
                  <>
                    {stepIdx !== steps.length - 1 ? (
                      <div
                        className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-indigo-600"
                        aria-hidden="true"
                      />
                    ) : null}
                    <a
                      href={step.href}
                      className="group relative flex items-start"
                    >
                      <span className="flex h-9 items-center">
                        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800">
                          <CheckIcon
                            className="h-5 w-5 text-white"
                            aria-hidden="true"
                          />
                        </span>
                      </span>
                      <span className="ml-4 flex min-w-0 flex-col">
                        <span className="text-sm font-medium">{step.name}</span>
                        <span className="text-sm text-gray-500">
                          {step.description}
                        </span>
                      </span>
                    </a>
                  </>
                ) : step.status === "current" ? (
                  <>
                    {stepIdx !== steps.length - 1 ? (
                      <div
                        className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"
                        aria-hidden="true"
                      />
                    ) : null}
                    <a
                      href={step.href}
                      className="group relative flex items-start"
                      aria-current="step"
                    >
                      <span
                        className="flex h-9 items-center"
                        aria-hidden="true"
                      >
                        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white">
                          <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                        </span>
                      </span>
                      <span className="ml-4 flex min-w-0 flex-col">
                        <span className="text-sm font-medium text-indigo-600">
                          {step.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {step.description}
                        </span>
                      </span>
                    </a>
                  </>
                ) : (
                  <>
                    {stepIdx !== steps.length - 1 ? (
                      <div
                        className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"
                        aria-hidden="true"
                      />
                    ) : null}
                    <a
                      href={step.href}
                      className="group relative flex items-start"
                    >
                      <span
                        className="flex h-9 items-center"
                        aria-hidden="true"
                      >
                        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white group-hover:border-gray-400">
                          <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
                        </span>
                      </span>
                      <span className="ml-4 flex min-w-0 flex-col">
                        <span className="text-sm font-medium text-gray-500">
                          {step.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {step.description}
                        </span>
                      </span>
                    </a>
                  </>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <form className="w-full px-8 mx-8 py-6 bg-white border-l-2 border-gray-200">
          <p className="text-sm text-gray-500">
            You are currently signed in as{" "}
            <span className="font-medium text-gray-900">
              {meta?.full_name || user?.email}
            </span>
          </p>
          <label
            htmlFor="database"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Choose a database to store your voice notes
          </label>
          <select
            id="database"
            name="database"
            className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            {(results as DatabaseObjectResponse[]).map((database) => (
              <option key={database.id} value={database.id}>
                {database.title[0]?.plain_text}
              </option>
            ))}
          </select>
        </form>
      </div>
    </main>
  );
}
