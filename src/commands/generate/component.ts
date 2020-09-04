import { GluegunToolbox } from "gluegun"

export const description = "Generates a component and a storybook test."
export const run = async function(toolbox: GluegunToolbox) {
  // grab some features
  const { parameters, strings, print, ignite, patching, filesystem, prompt } = toolbox
  const { camelCase, isBlank, kebabCase, pascalCase } = strings

  // validation
  if (isBlank(parameters.first)) {
    print.info("A name is required.")
    print.info(`ignite generate component <name>\n`)
    return
  }

  const name = parameters.first
  const pascalName = pascalCase(name)
  const camelCaseName = camelCase(name)
  const kebabCaseName = kebabCase(name)
  const props = { camelCaseName, kebabCaseName, name, undefined, pascalName }
  let genPath = "common"
  if (parameters.options && parameters.options.module) {
    const isCorrectModlue = await prompt.confirm(
      `You do want to generate a ${parameters.options.module} component?\n${print.colors.gray(`

      you can generate a componnet in you particular path by provider an optional module parameter.

      `)}`,
      true,
    )
    if (isCorrectModlue) {
      genPath = parameters.options.module
    }
  }
  const jobs = [
    {
      template: "component.story.tsx.ejs",
      target: `app/components/${genPath}/${kebabCaseName}/${kebabCaseName}.story.tsx`,
    },
    {
      template: "component.tsx.ejs",
      target: `app/components/${genPath}/${kebabCaseName}/${kebabCaseName}.tsx`,
    },
  ]

  await ignite.copyBatch(toolbox, jobs, props)

  // patch the barrel export file
  const barrelExportPath = `${process.cwd()}/app/components/index.ts`
  const exportToAdd = `export * from "./${genPath}/${kebabCaseName}/${kebabCaseName}"\n`

  if (!filesystem.exists(barrelExportPath)) {
    const msg =
      `No '${barrelExportPath}' file found. Can't export component.` +
      `Export your new component manually.`
    print.warning(msg)
    process.exit(1)
  }
  await patching.append(barrelExportPath, exportToAdd)

  // wire up example
  await patching.prepend(
    "./storybook/storybook-registry.ts",
    `require("../app/components/${genPath}/${kebabCaseName}/${kebabCaseName}.story")\n`,
  )
}
